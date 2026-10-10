import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\JcbDailyLogForm.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Change materialType from Select to Input
select_material = """            <Select
              label={t("fleet.dailyLog.form.materialType")}
              options={materialTypeOptions}
              value={formData.materialType}
              onChange={(e) => updateField("materialType", e.target.value)}
              disabled={isSaving || isReadOnly}
            />"""
input_material = """            <Input
              label={t("fleet.dailyLog.form.materialType")}
              placeholder={t("fleet.dailyLog.form.materialType") || "Enter material type"}
              value={formData.materialType}
              onChange={(e) => updateField("materialType", e.target.value)}
              disabled={isSaving || isReadOnly}
            />"""
content = content.replace(select_material, input_material)

# 2. Reorder sections.
diesel_sec_start = content.find('<div className="flex flex-col gap-4">\n          <SectionTitle>{t("fleet.dailyLog.form.diesel")}</SectionTitle>')
material_sec_start = content.find('<div className="flex flex-col gap-4">\n          <SectionTitle>{t("fleet.dailyLog.form.material")}</SectionTitle>')
work_details_sec_start = content.find('<div className="flex flex-col gap-4">\n          <SectionTitle>{t("fleet.dailyLog.form.workDetails")}</SectionTitle>')
buttons_sec_start = content.find('<div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">')

if diesel_sec_start != -1 and material_sec_start != -1 and work_details_sec_start != -1:
    diesel_sec = content[diesel_sec_start:material_sec_start]
    material_sec = content[material_sec_start:work_details_sec_start]
    work_details_sec = content[work_details_sec_start:buttons_sec_start]
    
    new_content = content[:diesel_sec_start] + work_details_sec + diesel_sec + material_sec + content[buttons_sec_start:]
    content = new_content

# We should also remove the now unused materialTypeOptions
content = re.sub(r"const materialTypeOptions = useMemo\(\s*\(\) => \[\s*(?:\{[^}]+\},?\s*)+\],\s*\[t\],\s*\);\n*", "", content, flags=re.MULTILINE)

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\JcbDailyLogForm.jsx", "w", encoding="utf-8") as f:
    f.write(content)
