import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\api\dailyLogApi.js", "r", encoding="utf-8") as f:
    content = f.read()

# Replace buildFormData usage with direct data
content = content.replace("buildFormData(data)", "data")

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\api\dailyLogApi.js", "w", encoding="utf-8") as f:
    f.write(content)
