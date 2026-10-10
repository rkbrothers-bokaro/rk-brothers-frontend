import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\TipperDailyLogForm.jsx", "r", encoding="utf-8") as f:
    content = f.read()

diesel_sec_start = content.find('<div className="flex flex-col gap-4">\n          <SectionTitle>{t("fleet.dailyLog.form.diesel")}</SectionTitle>')
trips_sec_start = content.find('<div className="flex flex-col gap-4">\n          <div className="flex items-center justify-between">\n            <SectionTitle>{t("fleet.dailyLog.form.trips")}</SectionTitle>')
work_details_sec_start = content.find('<div className="flex flex-col gap-4">\n          <SectionTitle>{t("fleet.dailyLog.form.workDetails")}</SectionTitle>')
buttons_sec_start = content.find('<div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">')

if diesel_sec_start != -1 and trips_sec_start != -1 and work_details_sec_start != -1:
    diesel_sec = content[diesel_sec_start:trips_sec_start]
    trips_and_work_sec = content[trips_sec_start:buttons_sec_start]
    
    new_content = content[:diesel_sec_start] + trips_and_work_sec + diesel_sec + content[buttons_sec_start:]
    content = new_content
    
    with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\components\TipperDailyLogForm.jsx", "w", encoding="utf-8") as f:
        f.write(content)
