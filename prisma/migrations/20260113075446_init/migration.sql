-- CreateTable
CREATE TABLE "hospitals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'TR',
    "phone" TEXT,
    "email" TEXT,
    "titckNumber" TEXT,
    "taxNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "hospitalId" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "avatarUrl" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "group" TEXT DEFAULT 'Genel',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usageInstructionTemplate" TEXT,
    "maintenanceProcedureTemplate" TEXT,

    CONSTRAINT "DeviceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "room" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractNumber" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "partsIncluded" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "documentPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "hospitalId" TEXT NOT NULL,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT NOT NULL,
    "manufacturer" TEXT,
    "tagNumber" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "barcode" TEXT,
    "rfidTag" TEXT,
    "categoryId" TEXT NOT NULL,
    "udiDI" TEXT,
    "udiPI" TEXT,
    "riskClass" TEXT,
    "ceMarking" TEXT,
    "ceMarkingDate" TIMESTAMP(3),
    "fdaRegistration" TEXT,
    "hospitalId" TEXT NOT NULL,
    "locationId" TEXT,
    "supplierId" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "warrantyExpiry" TIMESTAMP(3),
    "productionYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "description" TEXT,
    "specifications" TEXT,
    "images" TEXT,
    "documents" TEXT,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "maintenanceInterval" INTEGER,
    "lastCalibrationDate" TIMESTAMP(3),
    "nextCalibrationDate" TIMESTAMP(3),
    "calibrationInterval" INTEGER,
    "adverseEventsCount" INTEGER NOT NULL DEFAULT 0,
    "pmsNotes" TEXT,
    "totalMaintenanceCost" DOUBLE PRECISION,
    "totalRepairCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "isActiveRepair" BOOLEAN NOT NULL DEFAULT false,
    "repairStartDate" TIMESTAMP(3),
    "repairEndDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "duration" INTEGER,
    "technicianId" TEXT,
    "description" TEXT NOT NULL,
    "findings" TEXT,
    "actions" TEXT,
    "notes" TEXT,
    "procedure" TEXT,
    "procedureFile" TEXT,
    "cost" DOUBLE PRECISION,
    "partsReplaced" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationRecord" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "technicianId" TEXT,
    "calibrationLab" TEXT,
    "certificateNumber" TEXT,
    "certificateFile" TEXT,
    "result" TEXT,
    "findings" TEXT,
    "notes" TEXT,
    "cost" DOUBLE PRECISION,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceMovement" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocation" TEXT NOT NULL,
    "movedBy" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "minimumStock" INTEGER,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consumable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceConsumable" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "consumableId" TEXT NOT NULL,
    "quantityUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceConsumable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electronic_signatures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "reasonCode" TEXT,
    "workOrderId" TEXT,
    "calibrationId" TEXT,

    CONSTRAINT "electronic_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "findings" TEXT,
    "actionsToken" TEXT,
    "partsReplaced" TEXT,
    "laborHours" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "beforePhotoUrls" TEXT,
    "afterPhotoUrls" TEXT,
    "reporterName" TEXT,
    "reporterPhone" TEXT,
    "reporterTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capas" (
    "id" TEXT NOT NULL,
    "capaNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "preventiveAction" TEXT,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "effectiveness" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "capas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adverse_events" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "investigationFindings" TEXT,
    "correctiveActions" TEXT,
    "preventiveActions" TEXT,
    "reportedToAuthority" BOOLEAN NOT NULL DEFAULT false,
    "authorityReportNumber" TEXT,
    "reportedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "adverse_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_subject_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectEmail" TEXT NOT NULL,
    "subjectPhone" TEXT,
    "requestType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_subject_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "maintenanceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "calibrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "contractsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "utsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "complianceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reportsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "branchesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "trainingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "procurementEnabled" BOOLEAN NOT NULL DEFAULT false,
    "decommissioningEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupAuto" BOOLEAN NOT NULL DEFAULT false,
    "backupSchedule" TEXT NOT NULL DEFAULT 'daily',
    "backupRetention" INTEGER NOT NULL DEFAULT 30,
    "deviceTagFormat" TEXT NOT NULL DEFAULT 'TAG-{YYYY}-{SEQ}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_licenses" (
    "id" TEXT NOT NULL DEFAULT 'license',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstRunDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demoDurationHours" INTEGER NOT NULL DEFAULT 240,
    "licenseKey" TEXT,
    "activationDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "hardwareId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_app_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "actionUrl" TEXT,
    "metadata" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unmatched_calibrations" (
    "id" TEXT NOT NULL,
    "deviceSerialNumber" TEXT,
    "tagNumber" TEXT,
    "deviceName" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "location" TEXT,
    "hospitalId" TEXT,
    "calibrationLab" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "technicianName" TEXT,
    "status" TEXT,
    "result" TEXT,
    "certificateNumber" TEXT,
    "cost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unmatched_calibrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL,
    "trainingNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "instructor" TEXT,
    "institution" TEXT,
    "content" TEXT,
    "contentFile" TEXT,
    "certificateNumber" TEXT,
    "certificateFile" TEXT,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "score" DOUBLE PRECISION,
    "passingScore" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTraining" (
    "id" TEXT NOT NULL,
    "trainingRecordId" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceCategoryId" TEXT,
    "authorized" BOOLEAN NOT NULL DEFAULT false,
    "authorizedBy" TEXT,
    "authorizedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceProcurement" (
    "id" TEXT NOT NULL,
    "purchaseOrderNumber" TEXT NOT NULL,
    "deviceId" TEXT,
    "hospitalId" TEXT NOT NULL,
    "supplierId" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "deliveryChecklist" TEXT,
    "deliveryNotes" TEXT,
    "receivedBy" TEXT,
    "receivedDate" TIMESTAMP(3),
    "installationStatus" TEXT,
    "installationDate" TIMESTAMP(3),
    "installerName" TEXT,
    "installationNotes" TEXT,
    "testResults" TEXT,
    "acceptanceStatus" TEXT,
    "acceptedBy" TEXT,
    "acceptanceDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "commissioningStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "commissionedBy" TEXT,
    "commissionedDate" TIMESTAMP(3),
    "firstUserTrainingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceProcurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceDecommissioning" (
    "id" TEXT NOT NULL,
    "decommissionNumber" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBy" TEXT,
    "reason" TEXT NOT NULL,
    "reasonDetails" TEXT,
    "evaluationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "evaluatedBy" TEXT,
    "evaluationDate" TIMESTAMP(3),
    "evaluationNotes" TEXT,
    "technicalAssessment" TEXT,
    "approvalStatus" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "disposalMethod" TEXT,
    "disposalDate" TIMESTAMP(3),
    "disposalLocation" TEXT,
    "disposalCertificate" TEXT,
    "dataWiped" BOOLEAN NOT NULL DEFAULT false,
    "dataWipeDate" TIMESTAMP(3),
    "dataWipeMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceDecommissioning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceUptime" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "totalSeconds" INTEGER,
    "maintenanceRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceUptime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "idNumber" TEXT,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "hospitalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "sessionNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trainer" TEXT,
    "trainerOrg" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "content" TEXT,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "deviceCategoryId" TEXT,
    "hospitalId" TEXT,
    "validityMonths" INTEGER DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_documents" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_trainings" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_code_key" ON "hospitals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_hospitalId_idx" ON "users"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCategory_code_key" ON "DeviceCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "devices_tagNumber_key" ON "devices"("tagNumber");

-- CreateIndex
CREATE UNIQUE INDEX "devices_barcode_key" ON "devices"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "devices_rfidTag_key" ON "devices"("rfidTag");

-- CreateIndex
CREATE INDEX "devices_hospitalId_idx" ON "devices"("hospitalId");

-- CreateIndex
CREATE INDEX "devices_status_idx" ON "devices"("status");

-- CreateIndex
CREATE INDEX "devices_udiDI_idx" ON "devices"("udiDI");

-- CreateIndex
CREATE INDEX "devices_locationId_idx" ON "devices"("locationId");

-- CreateIndex
CREATE INDEX "devices_categoryId_idx" ON "devices"("categoryId");

-- CreateIndex
CREATE INDEX "devices_nextMaintenanceDate_idx" ON "devices"("nextMaintenanceDate");

-- CreateIndex
CREATE INDEX "devices_nextCalibrationDate_idx" ON "devices"("nextCalibrationDate");

-- CreateIndex
CREATE INDEX "devices_status_hospitalId_idx" ON "devices"("status", "hospitalId");

-- CreateIndex
CREATE INDEX "devices_hospitalId_status_idx" ON "devices"("hospitalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "devices_name_serialNumber_key" ON "devices"("name", "serialNumber");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_deviceId_idx" ON "MaintenanceRecord"("deviceId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_hospitalId_idx" ON "MaintenanceRecord"("hospitalId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_status_idx" ON "MaintenanceRecord"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_scheduledDate_idx" ON "MaintenanceRecord"("scheduledDate");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_isActiveRepair_idx" ON "MaintenanceRecord"("isActiveRepair");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_hospitalId_status_idx" ON "MaintenanceRecord"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "CalibrationRecord_deviceId_idx" ON "CalibrationRecord"("deviceId");

-- CreateIndex
CREATE INDEX "CalibrationRecord_hospitalId_idx" ON "CalibrationRecord"("hospitalId");

-- CreateIndex
CREATE INDEX "CalibrationRecord_status_idx" ON "CalibrationRecord"("status");

-- CreateIndex
CREATE INDEX "CalibrationRecord_scheduledDate_idx" ON "CalibrationRecord"("scheduledDate");

-- CreateIndex
CREATE INDEX "CalibrationRecord_expiryDate_idx" ON "CalibrationRecord"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Consumable_code_key" ON "Consumable"("code");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "electronic_signatures_userId_idx" ON "electronic_signatures"("userId");

-- CreateIndex
CREATE INDEX "electronic_signatures_workOrderId_idx" ON "electronic_signatures"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_workOrderNumber_key" ON "work_orders"("workOrderNumber");

-- CreateIndex
CREATE INDEX "work_orders_deviceId_idx" ON "work_orders"("deviceId");

-- CreateIndex
CREATE INDEX "work_orders_hospitalId_idx" ON "work_orders"("hospitalId");

-- CreateIndex
CREATE INDEX "work_orders_assignedToId_idx" ON "work_orders"("assignedToId");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_orders_scheduledDate_idx" ON "work_orders"("scheduledDate");

-- CreateIndex
CREATE INDEX "work_orders_dueDate_idx" ON "work_orders"("dueDate");

-- CreateIndex
CREATE INDEX "work_orders_hospitalId_status_idx" ON "work_orders"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "work_orders_status_scheduledDate_idx" ON "work_orders"("status", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "capas_capaNumber_key" ON "capas"("capaNumber");

-- CreateIndex
CREATE INDEX "capas_status_idx" ON "capas"("status");

-- CreateIndex
CREATE INDEX "capas_dueDate_idx" ON "capas"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "adverse_events_reportNumber_key" ON "adverse_events"("reportNumber");

-- CreateIndex
CREATE INDEX "adverse_events_deviceId_idx" ON "adverse_events"("deviceId");

-- CreateIndex
CREATE INDEX "adverse_events_eventDate_idx" ON "adverse_events"("eventDate");

-- CreateIndex
CREATE INDEX "adverse_events_status_idx" ON "adverse_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "data_subject_requests_requestNumber_key" ON "data_subject_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "data_subject_requests_status_idx" ON "data_subject_requests"("status");

-- CreateIndex
CREATE INDEX "data_subject_requests_dueDate_idx" ON "data_subject_requests"("dueDate");

-- CreateIndex
CREATE INDEX "in_app_notifications_userId_idx" ON "in_app_notifications"("userId");

-- CreateIndex
CREATE INDEX "in_app_notifications_read_idx" ON "in_app_notifications"("read");

-- CreateIndex
CREATE INDEX "in_app_notifications_createdAt_idx" ON "in_app_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "in_app_notifications_userId_read_idx" ON "in_app_notifications"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "unmatched_calibrations_hospitalId_idx" ON "unmatched_calibrations"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRecord_trainingNumber_key" ON "TrainingRecord"("trainingNumber");

-- CreateIndex
CREATE INDEX "TrainingRecord_userId_idx" ON "TrainingRecord"("userId");

-- CreateIndex
CREATE INDEX "TrainingRecord_trainingType_idx" ON "TrainingRecord"("trainingType");

-- CreateIndex
CREATE INDEX "TrainingRecord_status_idx" ON "TrainingRecord"("status");

-- CreateIndex
CREATE INDEX "TrainingRecord_trainingDate_idx" ON "TrainingRecord"("trainingDate");

-- CreateIndex
CREATE INDEX "DeviceTraining_trainingRecordId_idx" ON "DeviceTraining"("trainingRecordId");

-- CreateIndex
CREATE INDEX "DeviceTraining_deviceId_idx" ON "DeviceTraining"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceTraining_deviceCategoryId_idx" ON "DeviceTraining"("deviceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceProcurement_purchaseOrderNumber_key" ON "DeviceProcurement"("purchaseOrderNumber");

-- CreateIndex
CREATE INDEX "DeviceProcurement_deviceId_idx" ON "DeviceProcurement"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceProcurement_hospitalId_idx" ON "DeviceProcurement"("hospitalId");

-- CreateIndex
CREATE INDEX "DeviceProcurement_supplierId_idx" ON "DeviceProcurement"("supplierId");

-- CreateIndex
CREATE INDEX "DeviceProcurement_deliveryStatus_idx" ON "DeviceProcurement"("deliveryStatus");

-- CreateIndex
CREATE INDEX "DeviceProcurement_acceptanceStatus_idx" ON "DeviceProcurement"("acceptanceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceDecommissioning_decommissionNumber_key" ON "DeviceDecommissioning"("decommissionNumber");

-- CreateIndex
CREATE INDEX "DeviceDecommissioning_deviceId_idx" ON "DeviceDecommissioning"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceDecommissioning_hospitalId_idx" ON "DeviceDecommissioning"("hospitalId");

-- CreateIndex
CREATE INDEX "DeviceDecommissioning_status_idx" ON "DeviceDecommissioning"("status");

-- CreateIndex
CREATE INDEX "DeviceDecommissioning_requestDate_idx" ON "DeviceDecommissioning"("requestDate");

-- CreateIndex
CREATE INDEX "DeviceUptime_deviceId_idx" ON "DeviceUptime"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceUptime_startDate_idx" ON "DeviceUptime"("startDate");

-- CreateIndex
CREATE INDEX "DeviceUptime_status_idx" ON "DeviceUptime"("status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_registrationNumber_key" ON "staff"("registrationNumber");

-- CreateIndex
CREATE INDEX "staff_hospitalId_idx" ON "staff"("hospitalId");

-- CreateIndex
CREATE INDEX "staff_registrationNumber_idx" ON "staff"("registrationNumber");

-- CreateIndex
CREATE INDEX "staff_department_idx" ON "staff"("department");

-- CreateIndex
CREATE INDEX "staff_idNumber_idx" ON "staff"("idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "training_sessions_sessionNumber_key" ON "training_sessions"("sessionNumber");

-- CreateIndex
CREATE INDEX "training_sessions_hospitalId_idx" ON "training_sessions"("hospitalId");

-- CreateIndex
CREATE INDEX "training_sessions_trainingDate_idx" ON "training_sessions"("trainingDate");

-- CreateIndex
CREATE INDEX "training_sessions_sessionNumber_idx" ON "training_sessions"("sessionNumber");

-- CreateIndex
CREATE INDEX "training_documents_sessionId_idx" ON "training_documents"("sessionId");

-- CreateIndex
CREATE INDEX "staff_trainings_staffId_idx" ON "staff_trainings"("staffId");

-- CreateIndex
CREATE INDEX "staff_trainings_sessionId_idx" ON "staff_trainings"("sessionId");

-- CreateIndex
CREATE INDEX "staff_trainings_status_idx" ON "staff_trainings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_trainings_staffId_sessionId_key" ON "staff_trainings"("staffId", "sessionId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceMovement" ADD CONSTRAINT "DeviceMovement_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceMovement" ADD CONSTRAINT "DeviceMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceMovement" ADD CONSTRAINT "DeviceMovement_movedBy_fkey" FOREIGN KEY ("movedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumable" ADD CONSTRAINT "Consumable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceConsumable" ADD CONSTRAINT "DeviceConsumable_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceConsumable" ADD CONSTRAINT "DeviceConsumable_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electronic_signatures" ADD CONSTRAINT "electronic_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electronic_signatures" ADD CONSTRAINT "electronic_signatures_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adverse_events" ADD CONSTRAINT "adverse_events_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTraining" ADD CONSTRAINT "DeviceTraining_trainingRecordId_fkey" FOREIGN KEY ("trainingRecordId") REFERENCES "TrainingRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTraining" ADD CONSTRAINT "DeviceTraining_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTraining" ADD CONSTRAINT "DeviceTraining_deviceCategoryId_fkey" FOREIGN KEY ("deviceCategoryId") REFERENCES "DeviceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceProcurement" ADD CONSTRAINT "DeviceProcurement_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceProcurement" ADD CONSTRAINT "DeviceProcurement_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceProcurement" ADD CONSTRAINT "DeviceProcurement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceProcurement" ADD CONSTRAINT "DeviceProcurement_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceDecommissioning" ADD CONSTRAINT "DeviceDecommissioning_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceDecommissioning" ADD CONSTRAINT "DeviceDecommissioning_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceDecommissioning" ADD CONSTRAINT "DeviceDecommissioning_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceUptime" ADD CONSTRAINT "DeviceUptime_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_documents" ADD CONSTRAINT "training_documents_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_trainings" ADD CONSTRAINT "staff_trainings_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_trainings" ADD CONSTRAINT "staff_trainings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
