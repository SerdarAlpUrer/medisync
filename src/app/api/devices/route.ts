import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateNextTagNumber } from '@/lib/tag-generator'
import { withRateLimit } from '@/lib/rate-limit'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { deviceFilterSchema, paginationSchema } from '@/lib/validation'
import { cache, cacheKeys } from '@/lib/cache'
import { getAuthenticatedUser, canModify } from '@/lib/auth-middleware'

// GET /api/devices - Tüm cihazları listele
async function getDevices(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        // Validate query parameters (with safe parsing to avoid errors)
        let filterParams
        let paginationParams

        try {
            filterParams = deviceFilterSchema.parse({
                status: searchParams.get('status') || undefined,
                category: searchParams.get('category') || undefined,
                location: searchParams.get('location') || undefined,
                hospitalId: searchParams.get('hospitalId') || undefined,
                search: searchParams.get('search') || undefined,
            })
        } catch (error) {
            // If validation fails, use defaults
            filterParams = {
                status: searchParams.get('status') || undefined,
                category: searchParams.get('category') || undefined,
                location: searchParams.get('location') || undefined,
                hospitalId: searchParams.get('hospitalId') || undefined,
                search: searchParams.get('search') || undefined,
            }
        }

        // Check if pagination is requested
        const hasPagination = searchParams.get('page') || searchParams.get('limit')

        if (hasPagination) {
            try {
                paginationParams = paginationSchema.parse({
                    page: searchParams.get('page') || '1',
                    limit: searchParams.get('limit') || '20',
                })
            } catch (error) {
                // If validation fails, use defaults
                paginationParams = {
                    page: 1,
                    limit: 20,
                }
            }
        } else {
            // No pagination requested, return all devices
            paginationParams = {
                page: 1,
                limit: Number.MAX_SAFE_INTEGER, // Return all
            }
        }

        let targetHospitalId = filterParams.hospitalId
        try {
            const user = await getAuthenticatedUser()
            const role = (user?.role || '').toUpperCase()
            const isTechnicalStaff = role === 'ADMIN' || role === 'ENGINEER' || role === 'TECHNICIAN' || role === 'SUPERVISOR'
            // Only force user.hospitalId if NOT technical staff and no specific hospital filter was requested
            if (!isTechnicalStaff && user?.hospitalId) {
                targetHospitalId = user.hospitalId
            }
        } catch { }

        const effectiveFilterParams = {
            ...filterParams,
            hospitalId: targetHospitalId,
        }

        // Create cache key (only include pagination if requested)
        const cacheKeyData = hasPagination
            ? { ...effectiveFilterParams, page: paginationParams.page, limit: paginationParams.limit, sort: searchParams.get('sort'), order: searchParams.get('order') }
            : { ...effectiveFilterParams, sort: searchParams.get('sort'), order: searchParams.get('order') }
        const cacheKey = cacheKeys.devices(JSON.stringify(cacheKeyData))

        // Check cache
        const cached = cache.get(cacheKey) as any
        if (cached) {
            logger.debug('Devices fetched from cache', { cacheKey })
            // If no pagination, return direct array (backward compatibility)
            if (!hasPagination && Array.isArray(cached)) {
                return NextResponse.json(cached)
            }
            // If pagination, return new format
            if (cached.data && cached.meta) {
                return successResponse(cached.data, 200, cached.meta)
            }
            // Fallback
            return NextResponse.json(cached)
        }

        const where: Record<string, any> = {}

        if (filterParams.status && filterParams.status !== 'ALL') {
            if (filterParams.status === 'IN_MAINTENANCE' || filterParams.status === 'MAINTENANCE') {
                where.status = { in: ['MAINTENANCE', 'IN_MAINTENANCE'] }
            } else {
                where.status = filterParams.status
            }
        }
        if (filterParams.category) {
            where.categoryId = filterParams.category
        }
        if (filterParams.location) {
            where.locationId = filterParams.location
        }

        if (targetHospitalId) {
            where.hospitalId = targetHospitalId
        }
        if (filterParams.search) {
            where.OR = [
                { name: { contains: filterParams.search, mode: 'insensitive' } },
                { serialNumber: { contains: filterParams.search, mode: 'insensitive' } },
                { tagNumber: { contains: filterParams.search, mode: 'insensitive' } },
                { model: { contains: filterParams.search, mode: 'insensitive' } },
                { brand: { contains: filterParams.search, mode: 'insensitive' } },
            ]
        }

        // Get total count for pagination
        const total = await prisma.device.count({ where })

        // Determine sort order
        const sortParam = searchParams.get('sort') || 'createdAt'
        const orderParam = searchParams.get('order') || 'desc'

        let orderBy: any = { createdAt: 'desc' }

        if (sortParam === 'name') {
            orderBy = { name: orderParam === 'asc' ? 'asc' : 'desc' }
        } else if (sortParam === 'createdAt') {
            orderBy = { createdAt: orderParam === 'asc' ? 'asc' : 'desc' }
        } else if (sortParam === 'tagNumber') {
            orderBy = { tagNumber: orderParam === 'asc' ? 'asc' : 'desc' }
        } else if (sortParam === 'brand') {
            orderBy = { brand: orderParam === 'asc' ? 'asc' : 'desc' }
        } else if (sortParam === 'model') {
            orderBy = { model: orderParam === 'asc' ? 'asc' : 'desc' }
        } else if (sortParam === 'serialNumber') {
            orderBy = { serialNumber: orderParam === 'asc' ? 'asc' : 'desc' }
        } else if (sortParam === 'status') {
            orderBy = { status: orderParam === 'asc' ? 'asc' : 'desc' }
        } else if (sortParam === 'location') {
            orderBy = { location: { name: orderParam === 'asc' ? 'asc' : 'desc' } }
        }

        // Fetch devices - apply pagination only if requested
        const queryOptions: any = {
            where,
            include: {
                category: {
                    select: { id: true, name: true, code: true }
                },
                location: {
                    select: { id: true, name: true, code: true }
                },
                hospital: {
                    select: { id: true, name: true, code: true }
                },
                supplier: {
                    select: { id: true, name: true, code: true }
                },
            },
            orderBy,
        }

        // Only apply pagination if explicitly requested
        if (hasPagination && paginationParams.limit !== Number.MAX_SAFE_INTEGER) {
            queryOptions.skip = (paginationParams.page - 1) * paginationParams.limit
            queryOptions.take = paginationParams.limit
        }

        const devices = await prisma.device.findMany(queryOptions)

        // Backward compatibility: If no pagination params, return direct array (old format)
        // Otherwise return new format with pagination
        if (!hasPagination) {
            // Old format: Direct array for backward compatibility (all devices)
            cache.set(cacheKey, devices, 5 * 60 * 1000)
            return NextResponse.json(devices)
        }

        // New format: With pagination
        const totalPages = Math.ceil(total / paginationParams.limit)

        // New format: With pagination
        const responseData = {
            devices,
            pagination: {
                page: paginationParams.page,
                limit: paginationParams.limit,
                total,
                totalPages,
            }
        }

        // Cache the result (5 minutes)
        cache.set(cacheKey, {
            data: responseData,
            meta: {
                page: paginationParams.page,
                limit: paginationParams.limit,
                total,
                totalPages,
            }
        }, 5 * 60 * 1000)

        return successResponse(responseData, 200, {
            page: paginationParams.page,
            limit: paginationParams.limit,
            total,
            totalPages,
        })
    } catch (error) {
        logger.error('Error fetching devices', error as Error)
        const errorInfo = handleError(error)
        return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
    }
}

export const GET = withRateLimit(getDevices)

// POST /api/devices - Yeni cihaz ekle
async function createDevice(request: Request) {
    try {
        // VIEWER rolü kontrol - sadece görüntüleme yetkisi var
        try {
            const user = await getAuthenticatedUser()
            if (!canModify(user.role)) {
                return errorResponse('Görüntüleme hesabıyla cihaz ekleyemezsiniz', 403, 'FORBIDDEN')
            }
        } catch {
            // Auth hatası - devam et, diğer kontroller yakalayacak
        }

        const body = await request.json()

        // Validate request body
        const { createDeviceSchema } = await import('@/lib/validation')
        const validatedData = createDeviceSchema.parse(body)

        let hospitalId = validatedData.hospitalId
        try {
            const user = await getAuthenticatedUser()
            if (user?.hospitalId) {
                hospitalId = user.hospitalId
            }
        } catch { }

        // Eğer hospitalId gelmediyse, sistemdeki ilk hastaneyi varsayılan olarak al
        if (!hospitalId) {
            const defaultHospital = await prisma.hospital.findFirst()
            if (defaultHospital) {
                hospitalId = defaultHospital.id
            } else {
                // Hiç hastane yoksa, varsayılan bir tane oluştur
                const newHospital = await prisma.hospital.create({
                    data: {
                        name: 'Merkez Hastane',
                        code: 'MERKEZ',
                    }
                })
                hospitalId = newHospital.id
            }
        }

        // Kategori İşlemleri
        let categoryId = validatedData.categoryId
        const categoryName = validatedData.categoryName

        if (!categoryId && categoryName) {
            // İsimden kategori bul veya oluştur
            const code = categoryName.toUpperCase().replace(/\s+/g, '_').replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C')

            const category = await prisma.deviceCategory.upsert({
                where: { code },
                update: {},
                create: {
                    name: categoryName,
                    code,
                    description: `${categoryName} cihazları`
                }
            })
            categoryId = category.id
        }

        // Hala kategori yoksa varsayılanı kullan
        if (!categoryId) {
            let defaultCategory = await prisma.deviceCategory.findFirst()
            if (!defaultCategory) {
                defaultCategory = await prisma.deviceCategory.create({
                    data: {
                        name: 'Genel',
                        code: 'GENEL'
                    }
                })
            }
            categoryId = defaultCategory.id
        }

        // Extract fields from body
        const {
            name,
            brand,
            model,
            serialNumber,
            tagNumber: providedTagNumber, // Allow manual tag number
            barcode,
            rfidTag,
            manufacturer,
            supplierName,
            status,
            condition,
            purchasePrice,
            purchaseDate,
            warrantyExpiry,
            nextMaintenanceDate,
            maintenanceInterval,
            description,
            productionYear
        } = body

        // Lokasyon İşlemleri
        let locationId = body.locationId
        const locationName = body.locationName

        if (!locationId && locationName && locationName !== 'Bilinmiyor') {
            const code = locationName.toUpperCase().replace(/\s+/g, '_').replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
            const location = await prisma.location.upsert({
                where: { code },
                update: {},
                create: {
                    name: locationName,
                    code
                }
            })
            locationId = location.id
        }

        // Tedarikçi İşlemleri
        let supplierId = body.supplierId
        if (!supplierId && supplierName) {
            const code = supplierName.toUpperCase().replace(/\s+/g, '_').replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
            const supplier = await prisma.supplier.upsert({
                where: { code },
                update: {},
                create: {
                    name: supplierName,
                    code
                }
            })
            supplierId = supplier.id
        }

        // Generate Tag Number automatically
        const tagNumber = (validatedData.tagNumber && validatedData.tagNumber.trim() !== '')
            ? validatedData.tagNumber.trim()
            : await generateNextTagNumber(prisma, hospitalId)

        const device = await prisma.device.create({
            data: {
                name: validatedData.name.trim(),
                tagNumber,
                brand: validatedData.brand ? validatedData.brand.trim() : null,
                model: validatedData.model ? validatedData.model.trim() : 'N/A',
                serialNumber: validatedData.serialNumber.trim(),
                barcode: validatedData.barcode ? validatedData.barcode.trim() : null,
                rfidTag: validatedData.rfidTag ? validatedData.rfidTag.trim() : null,
                manufacturer: validatedData.manufacturer ? validatedData.manufacturer.trim() : null,
                locationId: locationId || null,
                supplierId: supplierId || null,
                status: validatedData.status || 'ACTIVE',
                condition: validatedData.condition || 'GOOD',
                hospitalId,
                categoryId,
                purchasePrice: validatedData.purchasePrice ?? null,
                purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
                warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : null,
                productionYear: validatedData.productionYear ?? null,
                nextMaintenanceDate: validatedData.nextMaintenanceDate ? new Date(validatedData.nextMaintenanceDate) : null,
                maintenanceInterval: validatedData.maintenanceInterval ?? null,
                description: validatedData.description ? validatedData.description.trim() : null
            },
            include: {
                category: true,
                location: true,
                hospital: true,
            },
        })

        // Clear cache for devices list and dashboard
        cache.delete(cacheKeys.devices('*'))
        cache.delete('dashboard:*')

        logger.info('Device created successfully', { deviceId: device.id, name: device.name })
        return successResponse(device, 201)
    } catch (error) {
        logger.error('Error creating device', error as Error)
        const errorInfo = handleError(error)
        return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
    }
}

export const POST = withRateLimit(createDevice, {
    maxRequests: 20, // Lower limit for POST requests
    windowMs: 60000,
})
