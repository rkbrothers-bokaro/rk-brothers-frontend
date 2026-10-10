import re

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\pages\DieselControlPage.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
content = content.replace(
    'import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";',
    'import { AlertTriangle, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";'
)
content = content.replace(
    'import { getDieselRegister, getFuelAnomalies } from "../api/dieselApi";',
    'import { getDieselRegister, getFuelAnomalies, getReceipts, deleteReceipt } from "../api/dieselApi";'
)

# Add state
state_code = """
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("register");
  const [receipts, setReceipts] = useState([]);
  const [editingReceipt, setEditingReceipt] = useState(null);
"""
content = content.replace(
    'const { isAdmin } = useAuth();\n',
    'const { isAdmin } = useAuth();\n' + state_code
)
# Make sure we don't duplicate toast if it was already there (not in this case)

# Add fetch receipts
fetch_receipts_code = """
  const fetchReceiptsList = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const { data } = await getReceipts(
        appliedFilters.vehicleId || undefined,
        appliedFilters.month,
        appliedFilters.year
      );
      setReceipts(unwrapList(data).items);
    } catch {
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, isAdmin]);

  useEffect(() => {
    if (activeTab === "receipts") fetchReceiptsList();
  }, [activeTab, fetchReceiptsList]);
"""
content = content.replace(
    'const fetchAnomalies = useCallback(async () => {',
    fetch_receipts_code + '\n  const fetchAnomalies = useCallback(async () => {'
)

# Replace the modal opening
content = content.replace(
    '        <Button onClick={() => setIsModalOpen(true)}>{t("fleet.diesel.addReceipt")}</Button>',
    """        <Button onClick={() => { setEditingReceipt(null); setIsModalOpen(true); }}>{t("fleet.diesel.addReceipt")}</Button>"""
)

# Add delete function and columns
columns_code = """
  async function handleDeleteReceipt(id) {
    if (!window.confirm(t("common.deleteConfirm") || "Are you sure you want to delete this?")) return;
    try {
      await deleteReceipt(id);
      toast.success(t("common.deleteSuccess") || "Deleted successfully");
      fetchReceiptsList();
      fetchRegister();
    } catch {
      // toast shown by interceptor
    }
  }

  const receiptsColumns = [
    { key: "date", header: t("fleet.diesel.columns.date") || "Date" },
    { key: "vehicleDisplayName", header: t("fleet.diesel.columns.equipment") || "Equipment", render: (r) => r.vehicleDisplayName || r.vehicleNo },
    { key: "litres", header: t("fleet.diesel.form.litres") || "Litres" },
    { key: "receivedFrom", header: t("fleet.diesel.form.receivedFrom") || "Received From" },
    { key: "invoiceNo", header: t("fleet.diesel.form.invoiceNo") || "Invoice No" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setEditingReceipt(row); setIsModalOpen(true); }} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => handleDeleteReceipt(row.id)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }
  ];
"""
content = content.replace(
    'const columns = [',
    columns_code + '\n  const columns = ['
)

# Tabs JSX
tabs_jsx = """
      <div className="mb-4 flex gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "register" ? "border-b-2 border-blue-600 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {t("fleet.diesel.registerTab") || "Monthly Register"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("receipts")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "receipts" ? "border-b-2 border-blue-600 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {t("fleet.diesel.receiptsTab") || "Receipts History"}
        </button>
      </div>
"""
content = content.replace(
    '      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">',
    tabs_jsx + '\n      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">'
)

table_jsx_old = '<Table columns={columns} data={visibleRows} loading={isLoading} emptyMessage={t("fleet.diesel.noData")} />'
table_jsx_new = """
      {activeTab === "register" ? (
        <Table columns={columns} data={visibleRows} loading={isLoading} emptyMessage={t("fleet.diesel.noData")} />
      ) : (
        <Table columns={receiptsColumns} data={receipts} loading={isLoading} emptyMessage={t("fleet.diesel.noData")} />
      )}
"""
content = content.replace(table_jsx_old, table_jsx_new)

# Update Modal props
modal_old = """        <AddDieselReceiptModal
          vehicles={vehicles}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchRegister();
            fetchAnomalies();
          }}
        />"""
modal_new = """        <AddDieselReceiptModal
          vehicles={vehicles}
          initialData={editingReceipt}
          onClose={() => { setIsModalOpen(false); setEditingReceipt(null); }}
          onSaved={() => {
            setIsModalOpen(false);
            setEditingReceipt(null);
            fetchRegister();
            if (activeTab === "receipts") fetchReceiptsList();
            fetchAnomalies();
          }}
        />"""
content = content.replace(modal_old, modal_new)

with open(r"D:\BB Client Projects\rk-brothers\rk-brothers-frontend\src\modules\fleet\pages\DieselControlPage.jsx", "w", encoding="utf-8") as f:
    f.write(content)
