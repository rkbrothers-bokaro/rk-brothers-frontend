import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\masters\WorkOrdersPage.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update EMPTY_FORM
content = content.replace('partyId: "",', 'partyName: "",')

# 2. Update setFormData inside handleEdit
content = content.replace('partyId: item.partyId || "",', 'partyName: item.partyName || "",')

# 3. Update validation
content = content.replace(
    'if (!formData.partyId) nextErrors.partyId = t("common.required");',
    'if (!formData.partyName.trim()) nextErrors.partyName = t("common.required");'
)

# 4. Update payload
content = content.replace('partyId: formData.partyId,', 'partyName: formData.partyName.trim(),')

# 5. Change Select to Input
select_block = """              <Select
                label={t("masters.workOrders.form.party")}
                options={partyOptions}
                value={formData.partyId}
                onChange={(e) => setFormData((f) => ({ ...f, partyId: e.target.value }))}
                error={formErrors.partyId}
                disabled={isSaving}
              />"""
input_block = """              <Input
                label={t("masters.workOrders.form.party")}
                placeholder={t("masters.workOrders.form.party") || "Enter party name"}
                value={formData.partyName}
                onChange={(e) => setFormData((f) => ({ ...f, partyName: e.target.value }))}
                error={formErrors.partyName}
                disabled={isSaving}
              />"""
content = content.replace(select_block, input_block)

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\masters\WorkOrdersPage.jsx", "w", encoding="utf-8") as f:
    f.write(content)
