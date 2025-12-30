/**
 * Zod Validation Schemas for API Routes
 */

import { z } from 'zod'

// Device Schemas
export const createDeviceSchema = z.object({
  name: z.string().min(1, 'Cihaz adı gereklidir').max(200),
  brand: z.string().max(100).optional(),
  model: z.string().min(1, 'Model gereklidir').max(100),
  serialNumber: z.string().min(1, 'Seri numarası gereklidir').max(100),
  tagNumber: z.string().max(50).optional(),
  barcode: z.string().max(100).optional(),
  rfidTag: z.string().max(100).optional(),
  manufacturer: z.string().max(200).optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().max(100).optional(),
  locationId: z.string().optional(),
  locationName: z.string().max(100).optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().max(200).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CALIBRATION', 'REPAIR', 'RETIRED']).optional(),
  condition: z.enum(['GOOD', 'FAIR', 'POOR', 'CRITICAL']).optional(),
  purchasePrice: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
  purchaseDate: z.string().datetime().optional(),
  warrantyExpiry: z.string().datetime().optional(),
  productionYear: z.string().transform(Number).pipe(z.number().int().min(1900).max(2100)).optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
  maintenanceInterval: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  description: z.string().max(1000).optional(),
  hospitalId: z.string().optional(),
})

export const updateDeviceSchema = createDeviceSchema.partial().extend({
  id: z.string().min(1),
})

// Maintenance Schemas
export const createMaintenanceSchema = z.object({
  deviceId: z.string().min(1, 'Cihaz ID gereklidir'),
  hospitalId: z.string().min(1, 'Hastane ID gereklidir'),
  type: z.string().min(1, 'Bakım tipi gereklidir'),
  status: z.string().optional(),
  priority: z.string().optional(),
  scheduledDate: z.string().datetime(),
  completedDate: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
  technicianId: z.string().optional(),
  description: z.string().min(1, 'Açıklama gereklidir'),
  findings: z.string().optional(),
  actions: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  partsReplaced: z.string().optional(),
})

// Calibration Schemas
export const createCalibrationSchema = z.object({
  deviceId: z.string().min(1, 'Cihaz ID gereklidir'),
  hospitalId: z.string().min(1, 'Hastane ID gereklidir'),
  status: z.string().optional(),
  scheduledDate: z.string().datetime(),
  completedDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  technicianId: z.string().optional(),
  calibrationLab: z.string().optional(),
  certificateNumber: z.string().optional(),
  certificateFile: z.string().optional(),
  result: z.string().optional(),
  findings: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().nonnegative().optional(),
})

// Work Order Schemas
export const createWorkOrderSchema = z.object({
  deviceId: z.string().min(1, 'Cihaz ID gereklidir'),
  hospitalId: z.string().min(1, 'Hastane ID gereklidir'),
  title: z.string().min(1, 'Başlık gereklidir').max(200),
  description: z.string().min(1, 'Açıklama gereklidir'),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSTALLATION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.string().optional(),
  assignedToId: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  reporterTitle: z.string().optional(),
})

// Hospital Schemas
export const createHospitalSchema = z.object({
  name: z.string().min(1, 'Hastane adı gereklidir').max(200),
  code: z.string().min(1, 'Kod gereklidir').max(50),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Geçerli bir email adresi giriniz').optional(),
  titckNumber: z.string().max(100).optional(),
  taxNumber: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
})

// User Schemas
export const createUserSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  name: z.string().min(1, 'İsim gereklidir').max(200),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'ENGINEER', 'USER', 'VIEWER']).optional(),
  hospitalId: z.string().optional(),
  phone: z.string().max(50).optional(),
  department: z.string().max(100).optional(),
})

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1),
  password: z.string().min(8).optional(),
})

// Query Parameter Schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('20'),
})

export const deviceFilterSchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  hospitalId: z.string().optional(),
  search: z.string().optional(),
})

