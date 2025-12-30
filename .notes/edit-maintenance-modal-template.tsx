// Maintenance Edit Modal Component
// This file will be imported into the maintenance page

export interface EditMaintenanceModalProps {
    maintenance: any
    devices: any[]
    technicians: any[]
    onClose: () => void
    onSave: (updatedMaintenance: any) => void
}

export function EditMaintenanceModal({
    maintenance,
    devices,
    technicians,
    onClose,
    onSave
}: EditMaintenanceModalProps) {
    const [formData, setFormData] = React.useState({
        id: maintenance.id,
        deviceId: maintenance.deviceId,
        type: maintenance.type,
        status: maintenance.status,
        priority: maintenance.priority,
        scheduledDate: new Date(maintenance.scheduledDate).toISOString().split('T')[0],
        technicianId: maintenance.technicianId || '',
        description: maintenance.description || '',
        cost: maintenance.cost || ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Bakım Kaydını Düzenle</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cihaz</label>
                        <select
                            required
                            value={formData.deviceId}
                            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {devices.map(device => (
                                <option key={device.id} value={device.id}>
                                    {device.name} - {device.serialNumber}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bakım Tipi</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="PREVENTIVE">Önleyici Bakım</option>
                                <option value="CORRECTIVE">Arıza Onarımı</option>
                                <option value="PREDICTIVE">Öngörücü Bakım</option>
                                <option value="INSPECTION">Muayene</option>
                                <option value="EMERGENCY">Acil Müdahale</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="LOW">Düşük</option>
                                <option value="MEDIUM">Orta</option>
                                <option value="HIGH">Yüksek</option>
                                <option value="CRITICAL">Kritik</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan Tarih</label>
                            <input
                                type="date"
                                required
                                value={formData.scheduledDate}
                                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teknisyen</label>
                            <select
                                value={formData.technicianId}
                                onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Teknisyen Seçin (Opsiyonel)</option>
                                {technicians.map(tech => (
                                    <option key={tech.id} value={tech.id}>
                                        {tech.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="SCHEDULED">Planlandı</option>
                            <option value="IN_PROGRESS">Devam Ediyor</option>
                            <option value="COMPLETED">Tamamlandı</option>
                            <option value="CANCELLED">İptal Edildi</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Bakım detayları..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Maliyet (₺)</label>
                        <input
                            type="number"
                            value={formData.cost}
                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                        >
                            Güncelle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
