import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wrench, 
  Save, 
  FolderOpen, 
  PlusCircle, 
  Search, 
  Menu, 
  X, 
  Box, 
  Filter, 
  Settings, 
  Edit,     
  Trash2, 
  PlusSquare, 
  Minus, 
  Plus,
  CheckCircle,
  ClipboardList 
} from 'lucide-react';

const App = () => {
  // --- 全域狀態 ---
  const [activeTab, setActiveTab] = useState('inbound'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // 檔案與讀取狀態
  const [fileName, setFileName] = useState("未命名專案檔.xlsx");
  const [isFileLoaded, setIsFileLoaded] = useState(false);
  const [statusText, setStatusText] = useState("等待操作");
  const [fileHandle, setFileHandle] = useState(null); 
  const fileInputRef = useRef(null); 

  // 資料集
  const [inbound, setInbound] = useState([]);      
  const [outbound, setOutbound] = useState([]);    
  const [models, setModels] = useState([]);        
  const [maintenance, setMaintenance] = useState([]); 

  // 搜尋與篩選
  const [searchTerm, setSearchTerm] = useState(""); 

  // --- 各頁面專用篩選 ---
  const [inboundFilterContract, setInboundFilterContract] = useState("");
  const [inboundFilterBrand, setInboundFilterBrand] = useState("");
  const [inboundFilterModel, setInboundFilterModel] = useState("");
  const [inboundFilterPart, setInboundFilterPart] = useState("");

  const [outboundFilterProjectID, setOutboundFilterProjectID] = useState("");
  const [outboundFilterBrand, setOutboundFilterBrand] = useState("");
  const [outboundFilterModel, setOutboundFilterModel] = useState("");
  const [outboundFilterPart, setOutboundFilterPart] = useState("");
  const [outboundFilterLocation, setOutboundFilterLocation] = useState(""); 

  const [overviewFilterBrand, setOverviewFilterBrand] = useState("");
  const [overviewFilterModel, setOverviewFilterModel] = useState("");
  const [overviewFilterPart, setOverviewFilterPart] = useState("");
  
  const [mgmtBrand, setMgmtBrand] = useState(""); 
  const [mgmtModel, setMgmtModel] = useState(""); 
  const [newPartName, setNewPartName] = useState(""); 
  const [newPartRefQty, setNewPartRefQty] = useState(""); 

  // Modal 控制
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [modalItem, setModalItem] = useState(null); 
  
  // --- 表單輸入值 ---
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formContractID, setFormContractID] = useState(""); 
  const [formBatch, setFormBatch] = useState("");
  const [formProjectID, setFormProjectID] = useState(""); 
  const [formLocation, setFormLocation] = useState("");   
  const [formNote, setFormNote] = useState(""); 
  
  const [inboundBrand, setInboundBrand] = useState("");
  const [inboundModel, setInboundModel] = useState("");
  
  const [partQuantities, setPartQuantities] = useState({}); 
  const [repairQty, setRepairQty] = useState(0);

  // --- 計算屬性 (Memo) ---
  const uniqueBrands = useMemo(() => [...new Set(models.map(item => item.Brand).filter(Boolean))], [models]);
  const getModelsByBrand = (brand) => {
      if (!brand) return [];
      return [...new Set(models.filter(m => m.Brand === brand).map(m => m.Model).filter(Boolean))];
  };

  const uniqueInboundBrands = useMemo(() => [...new Set(inbound.map(item => item.Brand).filter(Boolean))], [inbound]);
  const getInboundModelsByBrand = (brand) => {
      if (!brand) return [];
      return [...new Set(inbound.filter(m => m.Brand === brand).map(m => m.Model).filter(Boolean))];
  };
  const getInboundPartsByModel = (brand, model) => {
      if (!brand || !model) return [];
      return [...new Set(inbound.filter(m => m.Brand === brand && m.Model === model).map(m => m.PartName).filter(Boolean))];
  };

  const uniqueOutboundBrands = useMemo(() => [...new Set(outbound.map(item => item.Brand).filter(Boolean))], [outbound]);
  const getOutboundModelsByBrand = (brand) => {
      if (!brand) return [];
      return [...new Set(outbound.filter(m => m.Brand === brand).map(m => m.Model).filter(Boolean))];
  };
  const getOutboundPartsByModel = (brand, model) => {
      if (!brand || !model) return [];
      return [...new Set(outbound.filter(m => m.Brand === brand && m.Model === model).map(m => m.PartName).filter(Boolean))];
  };
  const uniqueOutboundLocations = useMemo(() => [...new Set(outbound.map(item => item.Location).filter(Boolean))], [outbound]);

  const uniqueOverviewBrands = useMemo(() => [...new Set(inbound.map(item => item.Brand).filter(Boolean))], [inbound]);
  const getOverviewModelsByBrand = (brand) => {
      if (!brand) return [];
      return [...new Set(inbound.filter(m => m.Brand === brand).map(m => m.Model).filter(Boolean))];
  };
  const getOverviewPartsByModel = (brand, model) => {
      if (!brand || !model) return [];
      return [...new Set(inbound.filter(m => m.Brand === brand && m.Model === model).map(m => m.PartName).filter(Boolean))];
  };

  const filteredInboundList = useMemo(() => {
      return inbound.filter(item => {
          const matchSearch = JSON.stringify(item).includes(searchTerm);
          const matchContract = inboundFilterContract ? item.ContractID.toString().toLowerCase().includes(inboundFilterContract.toLowerCase()) : true;
          const matchBrand = inboundFilterBrand ? item.Brand === inboundFilterBrand : true;
          const matchModel = inboundFilterModel ? item.Model === inboundFilterModel : true;
          const matchPart = inboundFilterPart ? item.PartName === inboundFilterPart : true;
          return matchSearch && matchContract && matchBrand && matchModel && matchPart;
      }).sort((a, b) => {
          const aHasStock = a.Balance > 0;
          const bHasStock = b.Balance > 0;
          if (aHasStock && !bHasStock) return -1; 
          if (!aHasStock && bHasStock) return 1;  
          return a.Date.localeCompare(b.Date);
      });
  }, [inbound, searchTerm, inboundFilterContract, inboundFilterBrand, inboundFilterModel, inboundFilterPart]);

  const filteredOutboundList = useMemo(() => {
      return outbound.filter(item => {
          const matchSearch = JSON.stringify(item).includes(searchTerm);
          const matchProject = outboundFilterProjectID ? (item.ProjectID || "").toString().toLowerCase().includes(outboundFilterProjectID.toLowerCase()) : true;
          const matchBrand = outboundFilterBrand ? item.Brand === outboundFilterBrand : true;
          const matchModel = outboundFilterModel ? item.Model === outboundFilterModel : true;
          const matchPart = outboundFilterPart ? item.PartName === outboundFilterPart : true;
          const matchLocation = outboundFilterLocation ? (item.Location || "").toString().toLowerCase().includes(outboundFilterLocation.toLowerCase()) : true;
          return matchSearch && matchProject && matchBrand && matchModel && matchPart && matchLocation;
      });
  }, [outbound, searchTerm, outboundFilterProjectID, outboundFilterBrand, outboundFilterModel, outboundFilterPart, outboundFilterLocation]);

  const mgmtData = useMemo(() => {
    return models.filter(item => {
      const matchBrand = mgmtBrand ? item.Brand === mgmtBrand : true;
      const matchModel = mgmtModel ? item.Model === mgmtModel : true;
      return matchBrand && matchModel;
    });
  }, [models, mgmtBrand, mgmtModel]);

  const overviewData = useMemo(() => {
      const map = {};
      inbound.forEach(item => {
          const key = `${item.Brand}::${item.Model}::${item.PartName}`;
          if (!map[key]) {
              map[key] = { Brand: item.Brand, Model: item.Model, PartName: item.PartName, TotalQty: 0 };
          }
          map[key].TotalQty += item.Balance;
      });
      let result = Object.values(map);
      result = result.filter(item => {
          const matchSearch = JSON.stringify(item).includes(searchTerm);
          const matchBrand = overviewFilterBrand ? item.Brand === overviewFilterBrand : true;
          const matchModel = overviewFilterModel ? item.Model === overviewFilterModel : true;
          const matchPart = overviewFilterPart ? item.PartName === overviewFilterPart : true;
          return matchSearch && matchBrand && matchModel && matchPart;
      });
      return result.sort((a, b) => {
          if (a.TotalQty > 0 && b.TotalQty === 0) return -1;
          if (a.TotalQty === 0 && b.TotalQty > 0) return 1;
          return a.Brand.localeCompare(b.Brand);
      });
  }, [inbound, searchTerm, overviewFilterBrand, overviewFilterModel, overviewFilterPart]);

  const availablePartsForInbound = useMemo(() => {
      if (!inboundBrand || !inboundModel) return [];
      return models.filter(m => m.Brand === inboundBrand && m.Model === inboundModel);
  }, [models, inboundBrand, inboundModel]);

  const availablePartsForOutbound = useMemo(() => {
      if (!inboundBrand || !inboundModel) return [];
      return models.filter(m => m.Brand === inboundBrand && m.Model === inboundModel);
  }, [models, inboundBrand, inboundModel]);

  const currentStockMap = useMemo(() => {
    if (modalType !== 'OUT') return {};
    const matchedRecords = inbound.filter(r => 
        r.ContractID === formContractID && 
        r.Batch === formBatch && 
        r.Brand === inboundBrand && 
        r.Model === inboundModel
    );
    const map = {};
    matchedRecords.forEach(r => {
        map[r.PartName] = (map[r.PartName] || 0) + r.Balance;
    });
    return map;
  }, [inbound, modalType, formContractID, formBatch, inboundBrand, inboundModel]);

  // --- 檔案處理 ---
  const handleCreateNewFile = () => {
    if (inbound.length > 0 && !confirm("確定要建立新檔嗎？未儲存的資料將會遺失。")) return;
    setInbound([]); setOutbound([]); setModels([]); setMaintenance([]); 
    setFileName("新工程案號管理.xlsx"); setFileHandle(null); setIsFileLoaded(true); setStatusText("新工作階段"); setActiveTab('inbound');
  };
  
  const processExcelData = (data) => {
      const wb = XLSX.read(data, { type: 'binary' });
      const getSheet = (name) => wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name]) : [];
      setInbound(getSheet('Inbound')); setOutbound(getSheet('Outbound')); setModels(getSheet('Models')); setMaintenance(getSheet('Maintenance'));
      setIsFileLoaded(true); setActiveTab('inbound'); 
  };

  const handleOpenFile = async () => {
      if (window.showOpenFilePicker) {
          try {
              const [handle] = await window.showOpenFilePicker({
                  types: [{ description: 'Excel Files', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
                  multiple: false
              });
              const file = await handle.getFile();
              const reader = new FileReader();
              reader.onload = (evt) => {
                  try {
                      processExcelData(evt.target.result);
                      setFileName(file.name); setFileHandle(handle); setStatusText("已載入檔案 (可直接存檔)");
                  } catch (e) { alert("讀取失敗"); }
              };
              reader.readAsBinaryString(file);
          } catch (err) { if (err.name !== 'AbortError') { console.error(err); if(fileInputRef.current) fileInputRef.current.click(); } }
      } else { if(fileInputRef.current) fileInputRef.current.click(); }
  };

  const handleFallbackFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name); setFileHandle(null);
      const reader = new FileReader();
      reader.onload = (evt) => processExcelData(evt.target.result);
      reader.readAsBinaryString(file);
      e.target.value = null;
    }
  };

  const handleExport = async () => {
    if (!isFileLoaded && inbound.length === 0) return alert("無資料可存檔");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inbound), "Inbound");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(outbound), "Outbound");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(models), "Models");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(maintenance), "Maintenance");

    if (fileHandle) {
        try {
            const writable = await fileHandle.createWritable();
            const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            await writable.write(buffer); await writable.close();
            setStatusText("已儲存 (覆蓋) " + new Date().toLocaleTimeString()); alert("儲存成功！(已覆蓋原檔)");
        } catch (err) { console.error(err); alert("寫入檔案失敗，嘗試另存新檔。"); setFileHandle(null); handleExport(); }
    } else {
        try {
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName, types: [{ description: 'Excel Workbook', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }, }],
                });
                const writable = await handle.createWritable();
                const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                await writable.write(buffer); await writable.close();
                setFileHandle(handle); setFileName(handle.name); setStatusText("已儲存 (新檔) " + new Date().toLocaleTimeString()); alert(`檔案「${handle.name}」儲存成功！`);
            } else { XLSX.writeFile(wb, fileName); setStatusText("已下載 " + new Date().toLocaleTimeString()); alert("檔案已下載！"); }
        } catch (err) { if (err.name !== 'AbortError') alert("儲存操作已取消"); }
    }
  };

  // --- 數量與刪除邏輯 ---
  
  // 1. 按鈕控制數量 (Delta)
  const handleQtyChange = (partName, delta, maxLimit = null) => {
      setPartQuantities(prev => {
          const currentQty = prev[partName] || 0;
          let newQty = currentQty + delta;
          if (newQty < 0) newQty = 0; 
          if (maxLimit !== null && newQty > maxLimit) newQty = maxLimit;
          return { ...prev, [partName]: newQty };
      });
  };

  // 2. 新增：手動輸入控制數量 (Input)
  const handleManualQtyChange = (partName, valueStr, maxLimit = null) => {
      let val = parseInt(valueStr);
      if (isNaN(val)) val = 0; // 若清空則為 0
      if (val < 0) val = 0;    // 不允許負數

      // 若有最大值限制 (出料/維修)，且輸入值超過庫存，則修正為最大值
      if (maxLimit !== null && val > maxLimit) {
          val = maxLimit;
      }

      setPartQuantities(prev => ({ ...prev, [partName]: val }));
  };

  const handleRepairQtyChange = (delta, maxLimit) => {
      setRepairQty(prev => {
          let newQty = prev + delta;
          if (newQty < 0) newQty = 0;
          if (newQty > maxLimit) newQty = maxLimit;
          return newQty;
      });
  };

  const handleDeleteInbound = (itemToDelete) => {
    let confirmMsg = "確定要刪除這筆進料紀錄嗎？";
    if (itemToDelete.InQty !== itemToDelete.Balance) {
        confirmMsg = "警告：此進料紀錄已經有出料或維修紀錄（剩餘數量不等於進料數量）。\n\n強制刪除可能會導致紀錄錯亂，您確定要繼續嗎？";
    }
    if (confirm(confirmMsg)) setInbound(inbound.filter(item => item !== itemToDelete));
  };

  const handleDeleteOutbound = (itemToDelete) => {
      if (!confirm(`確定要刪除此筆出料紀錄嗎？\n(料件: ${itemToDelete.PartName}, 數量: ${itemToDelete.OutQty})\n\n注意：刪除後，系統會自動將數量加回「進料紀錄」的剩餘庫存中。`)) return;
      let stockRestored = false;
      const updatedInbound = inbound.map(inItem => {
          if (!stockRestored && 
              inItem.ContractID === itemToDelete.ContractID && 
              inItem.Batch === itemToDelete.Batch &&
              inItem.Brand === itemToDelete.Brand &&
              inItem.Model === itemToDelete.Model &&
              inItem.PartName === itemToDelete.PartName
          ) {
              stockRestored = true;
              return { ...inItem, Balance: inItem.Balance + itemToDelete.OutQty };
          }
          return inItem;
      });
      if (!stockRestored) alert("警告：找不到對應的進料紀錄，無法自動還原庫存，僅刪除此筆出料紀錄。");
      setInbound(updatedInbound);
      setOutbound(outbound.filter(item => item !== itemToDelete));
  };

  const handleCompleteMaintenance = (item) => {
      if (item.Status === '維修完成') return;
      if (!confirm(`確定「${item.PartName}」已維修完成？\n\n系統將會把數量 (${item.Qty}) 加回庫存。`)) return;
      let stockRestored = false;
      const updatedInbound = inbound.map(inItem => {
          if (!stockRestored && 
              inItem.ContractID === item.ContractID &&
              inItem.Batch === item.Batch &&
              inItem.Brand === item.Brand &&
              inItem.Model === item.Model &&
              inItem.PartName === item.PartName
          ) {
              stockRestored = true;
              return { ...inItem, Balance: inItem.Balance + item.Qty };
          }
          return inItem;
      });
      if (!stockRestored) { alert("錯誤：找不到原始進料紀錄，無法還原庫存！"); return; }
      setInbound(updatedInbound);
      setMaintenance(maintenance.map(m => m === item ? { ...m, Status: '維修完成' } : m));
  };

  const handleDeleteMaintenance = (item) => {
      const isCompleted = item.Status === '維修完成';
      const msg = isCompleted ? "確定要刪除這筆歷史紀錄嗎？" : `確定要取消送修並刪除此紀錄嗎？\n\n系統將會把數量 (${item.Qty}) 加回庫存。`;
      if (!confirm(msg)) return;
      if (!isCompleted) {
          let stockRestored = false;
          const updatedInbound = inbound.map(inItem => {
              if (!stockRestored && 
                  inItem.ContractID === item.ContractID &&
                  inItem.Batch === item.Batch &&
                  inItem.Brand === item.Brand &&
                  inItem.Model === item.Model &&
                  inItem.PartName === item.PartName
              ) {
                  stockRestored = true;
                  return { ...inItem, Balance: inItem.Balance + item.Qty };
              }
              return inItem;
          });
          if (!stockRestored) alert("警告：找不到原始進料紀錄，無法還原庫存，僅刪除紀錄。");
          else setInbound(updatedInbound);
      }
      setMaintenance(maintenance.filter(m => m !== item));
  };

  const handleSubmit = () => {
    if (modalType === 'ADD_INBOUND') {
        if (!formContractID || !formBatch) return alert("請填寫契約編號與批次");
        if (!inboundBrand || !inboundModel) return alert("請選擇廠牌與機型");
        const newRecords = [];
        availablePartsForInbound.forEach(part => {
            const qty = partQuantities[part.PartName] || 0;
            if (qty > 0) {
                newRecords.push({
                    Date: formDate, ContractID: formContractID, Batch: formBatch,
                    Brand: inboundBrand, Model: inboundModel, PartName: part.PartName,
                    InQty: qty, Balance: qty 
                });
            }
        });
        if (newRecords.length === 0) return alert("請至少輸入一個料件的數量");
        setInbound([...newRecords, ...inbound]); closeModal(); return;
    }
    if (modalType === 'OUT') {
        if (!formContractID || !formBatch || !formProjectID) return alert("契約編號、批次與工程編號為必填");
        let updatedInbound = [...inbound];
        const newOutbounds = [];
        let hasAction = false;
        for (const part of availablePartsForOutbound) {
            const qtyToOut = partQuantities[part.PartName] || 0;
            if (qtyToOut > 0) {
                hasAction = true;
                let processed = false;
                updatedInbound = updatedInbound.map(record => {
                    if (!processed && record.ContractID === formContractID && record.Batch === formBatch &&
                        record.Brand === inboundBrand && record.Model === inboundModel && record.PartName === part.PartName) {
                        if (record.Balance < qtyToOut) {
                            alert(`料件 ${part.PartName} 庫存不足 (剩餘: ${record.Balance})`); throw new Error("Stock shortage"); 
                        }
                        processed = true; return { ...record, Balance: record.Balance - qtyToOut };
                    }
                    return record;
                });
                newOutbounds.push({
                    Date: formDate, ContractID: formContractID, Batch: formBatch, ProjectID: formProjectID,
                    Brand: inboundBrand, Model: inboundModel, PartName: part.PartName, OutQty: qtyToOut, Location: formLocation
                });
            }
        }
        if (!hasAction) return alert("未輸入任何出料數量");
        try { setInbound(updatedInbound); setOutbound([...newOutbounds, ...outbound]); closeModal(); } catch (e) {} return;
    }
    if (modalType === 'REPAIR') {
        if (repairQty <= 0) return alert("請輸入送修數量");
        if (modalItem.Balance < repairQty) return alert("剩餘庫存不足！");
        const updatedInbound = inbound.map(item => {
            if (item === modalItem) { return { ...item, Balance: item.Balance - repairQty }; }
            return item;
        });
        setInbound(updatedInbound);
        const newMaint = {
            Date: formDate, Status: "維修中", ContractID: modalItem.ContractID, Batch: modalItem.Batch,
            Brand: modalItem.Brand, Model: modalItem.Model, PartName: modalItem.PartName, Qty: repairQty, Note: formNote
        };
        setMaintenance([newMaint, ...maintenance]); closeModal(); return;
    }
    if (modalType === 'ADD_MODEL') {
        if (!inboundBrand || !inboundModel) return alert("請輸入廠牌與機型");
        setMgmtBrand(inboundBrand); setMgmtModel(inboundModel);
        alert(`已建立 ${inboundBrand} - ${inboundModel}，請在下方表格新增料件。`);
        closeModal(); return;
    }
  };

  const handleAddPartToModel = () => {
      if (!mgmtBrand || !mgmtModel) return alert("請先篩選廠牌與機型");
      if (!newPartName) return alert("請輸入料件名稱");
      const newPart = { Brand: mgmtBrand, Model: mgmtModel, PartName: newPartName, RefQty: parseInt(newPartRefQty) || 0 };
      setModels([...models, newPart]); setNewPartName(""); setNewPartRefQty("");
  };

  const handleDeleteModelItem = (itemToDelete) => {
    if (confirm("確定刪除此料件設定嗎？")) setModels(models.filter(m => m !== itemToDelete));
  };

  const openModal = (type, item = null) => {
      setModalType(type); setModalItem(item); setModalOpen(true);
      setFormDate(new Date().toISOString().split('T')[0]); setPartQuantities({}); setFormNote(""); setRepairQty(0);
      if (type === 'ADD_INBOUND') { setInboundBrand(""); setInboundModel(""); setFormContractID(""); setFormBatch(""); } 
      else if (type === 'OUT') { setFormContractID(item.ContractID); setFormBatch(item.Batch); setInboundBrand(item.Brand); setInboundModel(item.Model); setFormProjectID(""); setFormLocation(""); } 
      else if (type === 'ADD_MODEL') { setInboundBrand(""); setInboundModel(""); }
  };

  useEffect(() => {
    if (modalOpen && modalType === 'OUT' && inboundBrand && inboundModel) {
        const parts = models.filter(m => m.Brand === inboundBrand && m.Model === inboundModel);
        const matchedInbound = inbound.filter(r => r.ContractID === formContractID && r.Batch === formBatch && r.Brand === inboundBrand && r.Model === inboundModel);
        const stockMap = matchedInbound.reduce((acc, r) => { acc[r.PartName] = (acc[r.PartName] || 0) + r.Balance; return acc; }, {});
        const initialQty = {};
        parts.forEach(part => {
            const stock = stockMap[part.PartName] || 0;
            const refQty = part.RefQty || 0;
            initialQty[part.PartName] = Math.min(refQty, stock);
        });
        setPartQuantities(initialQty);
    }
  }, [modalOpen, modalType, inboundBrand, inboundModel, formContractID, formBatch, models, inbound]);

  const closeModal = () => { setModalOpen(false); setModalItem(null); };

  const renderContent = () => {
    if (!isFileLoaded) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <FolderOpen size={48} className="mb-4 text-gray-300 opacity-50"/>
          <h2 className="text-xl font-bold text-gray-600 mb-2">請先選擇檔案操作</h2>
        </div>
      );
    }
    
    switch (activeTab) {
        case 'overview': return (
            <div className="space-y-4 h-full flex flex-col">
                <div className="flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="text-purple-600"/> 料庫總覽 (不分批次)</h2>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-gray-200 flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 text-gray-600 text-sm font-bold"><Filter size={16}/> 篩選:</div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">廠牌</label><select className="border rounded px-2 py-1 text-sm bg-white" value={overviewFilterBrand} onChange={e=>{setOverviewFilterBrand(e.target.value);setOverviewFilterModel("");setOverviewFilterPart("")}}><option value="">全部</option>{uniqueOverviewBrands.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">機型</label><select className="border rounded px-2 py-1 text-sm bg-white" value={overviewFilterModel} onChange={e=>{setOverviewFilterModel(e.target.value);setOverviewFilterPart("")}} disabled={!overviewFilterBrand}><option value="">全部</option>{getOverviewModelsByBrand(overviewFilterBrand).map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">料件</label><select className="border rounded px-2 py-1 text-sm bg-white" value={overviewFilterPart} onChange={e=>setOverviewFilterPart(e.target.value)} disabled={!overviewFilterModel}><option value="">全部</option>{getOverviewPartsByModel(overviewFilterBrand, overviewFilterModel).map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                    <div className="ml-auto text-xs text-gray-400">共 {overviewData.length} 項料件</div>
                </div>
                <div className="flex-1 bg-white rounded shadow overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 sticky top-0 z-10">
                                <tr><th className="p-3 w-32">廠牌</th><th className="p-3 w-32">機型</th><th className="p-3 text-right w-32">總剩餘數量</th><th className="p-3">料件名稱</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {overviewData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50"><td className="p-3 text-gray-600">{item.Brand}</td><td className="p-3 text-gray-600">{item.Model}</td><td className={`p-3 text-right font-mono text-lg font-bold ${item.TotalQty===0?'text-gray-300':'text-blue-600'}`}>{item.TotalQty}</td><td className="p-3 font-bold">{item.PartName}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );

        case 'inbound': return (
            <div className="space-y-4 h-full flex flex-col">
                <div className="flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ArrowDownCircle className="text-blue-600"/> 進料紀錄</h2>
                    <button onClick={() => openModal('ADD_INBOUND')} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm shadow hover:bg-blue-700"><PlusCircle size={16}/> 進料</button>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-gray-200 flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 text-gray-600 text-sm font-bold"><Filter size={16}/> 篩選:</div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">契約</label><input type="text" placeholder="編號..." className="border rounded px-2 py-1 text-sm bg-white w-24" value={inboundFilterContract} onChange={e=>setInboundFilterContract(e.target.value)} /></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">廠牌</label><select className="border rounded px-2 py-1 text-sm bg-white" value={inboundFilterBrand} onChange={e=>{setInboundFilterBrand(e.target.value);setInboundFilterModel("");setInboundFilterPart("")}}><option value="">全部</option>{uniqueInboundBrands.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">機型</label><select className="border rounded px-2 py-1 text-sm bg-white" value={inboundFilterModel} onChange={e=>{setInboundFilterModel(e.target.value);setInboundFilterPart("")}} disabled={!inboundFilterBrand}><option value="">全部</option>{getInboundModelsByBrand(inboundFilterBrand).map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">料件</label><select className="border rounded px-2 py-1 text-sm bg-white" value={inboundFilterPart} onChange={e=>setInboundFilterPart(e.target.value)} disabled={!inboundFilterModel}><option value="">全部</option>{getInboundPartsByModel(inboundFilterBrand, inboundFilterModel).map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                    <div className="ml-auto text-xs text-gray-400">共 {filteredInboundList.length} 筆</div>
                </div>
                <div className="flex-1 bg-white rounded shadow overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 w-24">進料日期</th><th className="p-3">契約編號</th><th className="p-3 w-20">批次</th><th className="p-3">廠牌</th><th className="p-3">機型</th><th className="p-3">料件名稱</th><th className="p-3 text-right w-20">進料數量</th><th className="p-3 text-right">剩餘數量</th><th className="p-3 text-center w-12">出料</th><th className="p-3 text-center w-12">送修</th><th className="p-3 text-center w-12 text-red-500">刪除</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInboundList.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="p-3 text-sm">{item.Date}</td><td className="p-3 text-blue-600 font-medium">{item.ContractID}</td><td className="p-3 text-sm">{item.Batch}</td><td className="p-3 text-sm">{item.Brand}</td><td className="p-3 text-sm">{item.Model}</td><td className="p-3 font-bold">{item.PartName}</td><td className="p-3 text-right text-gray-400">{item.InQty}</td><td className={`p-3 text-right font-bold text-lg ${item.Balance===0?'text-gray-300':'text-blue-600'}`}>{item.Balance}</td>
                                        <td className="p-3 text-center"><button onClick={() => openModal('OUT', item)} disabled={item.Balance<=0} className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-30"><ArrowUpCircle size={16}/></button></td>
                                        <td className="p-3 text-center"><button onClick={() => openModal('REPAIR', item)} disabled={item.Balance<=0} className="p-1 text-amber-600 hover:bg-amber-100 rounded disabled:opacity-30"><Wrench size={16}/></button></td>
                                        <td className="p-3 text-center"><button onClick={() => handleDeleteInbound(item)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );

        case 'outbound': return (
            <div className="space-y-4 h-full flex flex-col">
                <h2 className="text-2xl font-bold flex items-center gap-2 flex-shrink-0"><ArrowUpCircle className="text-red-600"/> 出料記錄</h2>
                <div className="bg-white p-3 rounded shadow-sm border border-gray-200 flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 text-gray-600 text-sm font-bold"><Filter size={16}/> 篩選:</div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">工程編號</label><input type="text" placeholder="輸入編號..." className="border rounded px-2 py-1 text-sm bg-white w-24" value={outboundFilterProjectID} onChange={e=>setOutboundFilterProjectID(e.target.value)} /></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">廠牌</label><select className="border rounded px-2 py-1 text-sm bg-white" value={outboundFilterBrand} onChange={e=>{setOutboundFilterBrand(e.target.value);setOutboundFilterModel("");setOutboundFilterPart("")}}><option value="">全部</option>{uniqueOutboundBrands.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">機型</label><select className="border rounded px-2 py-1 text-sm bg-white" value={outboundFilterModel} onChange={e=>{setOutboundFilterModel(e.target.value);setOutboundFilterPart("")}} disabled={!outboundFilterBrand}><option value="">全部</option>{getOutboundModelsByBrand(outboundFilterBrand).map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">料件</label><select className="border rounded px-2 py-1 text-sm bg-white" value={outboundFilterPart} onChange={e=>setOutboundFilterPart(e.target.value)} disabled={!outboundFilterModel}><option value="">全部</option>{getOutboundPartsByModel(outboundFilterBrand, outboundFilterModel).map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                    <div className="flex items-center gap-2"><label className="text-xs text-gray-500">地點</label><input type="text" placeholder="輸入地點..." className="border rounded px-2 py-1 text-sm bg-white w-32" value={outboundFilterLocation} onChange={e=>setOutboundFilterLocation(e.target.value)} /></div>
                    <div className="ml-auto text-xs text-gray-400">共 {filteredOutboundList.length} 筆</div>
                </div>
                <div className="flex-1 bg-white rounded shadow overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 w-24">出料日期</th><th className="p-3">契約編號</th><th className="p-3 w-20">批次</th><th className="p-3 font-bold text-purple-600">工程編號</th><th className="p-3 w-20">廠牌</th><th className="p-3">機型</th><th className="p-3">料件名稱</th><th className="p-3 text-right text-red-600">消耗數量</th><th className="p-3 w-96">地點</th><th className="p-3 text-center w-16 text-red-500">刪除</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOutboundList.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-3 text-sm">{item.Date}</td><td className="p-3">{item.ContractID}</td><td className="p-3">{item.Batch}</td><td className="p-3 font-bold text-purple-600">{item.ProjectID}</td><td className="p-3">{item.Brand}</td><td className="p-3">{item.Model}</td><td className="p-3 font-bold">{item.PartName}</td><td className="p-3 text-right font-bold text-red-600">{item.OutQty}</td><td className="p-3 text-gray-500">{item.Location}</td>
                                        <td className="p-3 text-center"><button onClick={() => handleDeleteOutbound(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );

        // ... (Models & Maintenance sections remain same)
        case 'models': return (
            <div className="space-y-4 h-full flex flex-col">
                <div className="flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">📦 機型管理</h2>
                    <button onClick={() => openModal('ADD_MODEL')} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-black"><PlusCircle size={16}/> 新增機型</button>
                </div>
                <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col min-h-0">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex items-center gap-2 text-gray-600 font-bold"><Filter size={18}/> 管理篩選</div>
                        <div className="w-full md:w-48"><label className="text-xs text-gray-500 block mb-1">廠牌</label><select className="w-full border rounded px-3 py-1.5 text-sm bg-white outline-none focus:border-blue-500" value={mgmtBrand} onChange={(e) => { setMgmtBrand(e.target.value); setMgmtModel(""); }}><option value="">全部</option>{uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                        <div className="w-full md:w-48"><label className="text-xs text-gray-500 block mb-1">機型</label><select className="w-full border rounded px-3 py-1.5 text-sm bg-white outline-none focus:border-blue-500" value={mgmtModel} onChange={(e) => setMgmtModel(e.target.value)} disabled={!mgmtBrand}><option value="">全部</option>{getModelsByBrand(mgmtBrand).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b sticky top-0 z-10"><tr><th className="px-6 py-3">料件名稱</th><th className="px-6 py-3 text-right">數量(參考)</th><th className="px-6 py-3 text-center">編輯</th><th className="px-6 py-3 text-center">刪除</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {mgmtData.map((item, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-6 py-3 font-bold text-gray-800">{item.PartName}</td><td className="px-6 py-3 text-right text-gray-500">{item.RefQty || '-'}</td><td className="px-6 py-3 text-center"><button className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button></td><td className="px-6 py-3 text-center"><button onClick={() => handleDeleteModelItem(item)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button></td></tr>))}
                                {(mgmtBrand && mgmtModel) && (<tr className="bg-blue-50/50"><td className="px-6 py-3"><input type="text" placeholder="輸入新料件名稱..." className="w-full border-b border-blue-300 bg-transparent focus:outline-none focus:border-blue-600 text-sm py-1" value={newPartName} onChange={(e) => setNewPartName(e.target.value)}/></td><td className="px-6 py-3 text-right"><input type="number" placeholder="數量" className="w-20 border-b border-blue-300 bg-transparent focus:outline-none focus:border-blue-600 text-sm py-1 text-right" value={newPartRefQty} onChange={(e) => setNewPartRefQty(e.target.value)}/></td><td colSpan="2" className="px-6 py-3 text-center"><button onClick={handleAddPartToModel} className="flex items-center justify-center gap-1 text-blue-600 text-sm font-bold hover:underline w-full"><PlusSquare size={16}/> 新增</button></td></tr>)}
                            </tbody>
                        </table>
                        {(!mgmtBrand || !mgmtModel) && <div className="p-8 text-center text-gray-400">請先在上方篩選「廠牌」與「機型」以管理料件</div>}
                    </div>
                </div>
            </div>
        );

        case 'maintenance': return (
            <div className="space-y-4 h-full flex flex-col">
                <h2 className="text-2xl font-bold flex items-center gap-2 flex-shrink-0"><Wrench className="text-amber-600"/> 維修紀錄</h2>
                <div className="flex-1 bg-white rounded shadow overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 sticky top-0 z-10">
                                <tr><th className="p-3 w-20">狀態</th><th className="p-3">送修日期</th><th className="p-3">契約編號</th><th className="p-3">批次</th><th className="p-3">廠牌</th><th className="p-3">機型</th><th className="p-3">料件名稱</th><th className="p-3 text-right">數量</th><th className="p-3 w-40">備註</th><th className="p-3 text-center w-20">維修完成</th><th className="p-3 text-center w-16">刪除</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {maintenance.filter(i => JSON.stringify(i).includes(searchTerm)).map((item, idx) => {
                                    const isDone = item.Status === '維修完成';
                                    return (
                                        <tr key={idx} className={`hover:bg-gray-50 ${isDone ? 'bg-gray-50 opacity-70' : ''}`}>
                                            <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${isDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.Status}</span></td>
                                            <td className="p-3 text-sm">{item.Date}</td><td className="p-3 text-sm">{item.ContractID}</td><td className="p-3 text-sm">{item.Batch}</td><td className="p-3 text-sm">{item.Brand}</td><td className="p-3 text-sm">{item.Model}</td><td className="p-3 font-bold">{item.PartName}</td><td className="p-3 text-right font-mono">{item.Qty}</td><td className="p-3 text-sm text-gray-500">{item.Note || '-'}</td>
                                            <td className="p-3 text-center">{!isDone && (<button onClick={() => handleCompleteMaintenance(item)} className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="維修完成"><CheckCircle size={18}/></button>)}</td>
                                            <td className="p-3 text-center"><button onClick={() => handleDeleteMaintenance(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="刪除"><Trash2 size={16}/></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );

        default: return null;
    }
  };

  return (
    <div className="flex flex-row w-screen h-screen bg-gray-100 overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#0f172a] text-gray-300 h-full flex flex-col transition-all duration-300 shadow-2xl z-20 flex-shrink-0`}>
        <div className="p-6 flex items-center gap-3"><Box className="text-emerald-400" size={24} />{isSidebarOpen && <h1 className="text-white font-bold text-lg">工程庫存管理</h1>}</div>
        {isSidebarOpen && (<div className="px-4 pb-4 mb-2 border-b border-slate-700"><div className="space-y-2"><button onClick={handleOpenFile} className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-slate-600 hover:bg-slate-700 cursor-pointer transition-colors group"><FolderOpen size={18} className="text-blue-400 group-hover:text-blue-300"/><span className="text-sm font-medium text-gray-300">開啟舊檔</span></button><input type="file" ref={fileInputRef} onChange={handleFallbackFileUpload} className="hidden" accept=".xlsx" /><button onClick={handleCreateNewFile} className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors text-left group"><PlusCircle size={18} className="text-purple-400 group-hover:text-purple-300"/><span className="text-sm font-medium text-gray-300">建立新檔</span></button><button onClick={handleExport} className="flex items-center justify-center gap-2 w-full p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all mt-2 active:scale-95"><Save size={18} /><span className="text-sm font-bold">儲存變更</span></button></div><div className="mt-3 text-xs text-center text-gray-500 truncate" title={fileName}>{fileName}</div></div>)}
        <nav className="flex-1 px-3 space-y-1 mt-2">{[{ id: 'overview', label: '料庫總覽', icon: ClipboardList }, { id: 'inbound', label: '進料紀錄', icon: ArrowDownCircle }, { id: 'outbound', label: '出料記錄', icon: ArrowUpCircle }, { id: 'maintenance', label: '維修紀錄', icon: Wrench }, { id: 'models', label: '機型管理', icon: Settings }].map(btn => (<button key={btn.id} onClick={() => setActiveTab(btn.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${activeTab === btn.id ? 'bg-slate-800 text-white shadow-lg' : 'hover:bg-slate-800/50'}`}><btn.icon size={20} className={activeTab===btn.id ? 'text-emerald-400' : 'text-gray-500'} /> {isSidebarOpen && <span>{btn.label}</span>}</button>))}</nav>
      </aside>
      <main className="flex-1 h-full flex flex-col bg-gray-50 relative overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0 z-10"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={20}/></button><div className="relative w-72"><Search className="absolute left-3 top-2.5 text-gray-400" size={18}/><input type="text" placeholder="全域搜尋..." className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div></header>
        <div className="flex-1 overflow-auto p-6 scroll-smooth">{renderContent()}</div>
        {modalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className={`bg-white rounded-xl shadow-2xl p-6 relative flex flex-col ${modalType !== 'ADD_MODEL' && modalType !== 'REPAIR' ? 'w-full max-w-2xl h-4/5' : 'w-full max-w-md'}`}>
                    <button onClick={closeModal} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">{modalType==='ADD_INBOUND' && '新增進料 (Check In)'}{modalType==='OUT' && '料件出料 (Check Out)'}{modalType==='REPAIR' && '料件送修'}{modalType==='ADD_MODEL' && '新增機型分類'}</h3>
                    {modalType === 'ADD_MODEL' && (<div className="space-y-3"><input className="w-full border p-2 rounded" placeholder="廠牌" value={inboundBrand} onChange={e=>setInboundBrand(e.target.value)} /><input className="w-full border p-2 rounded" placeholder="機型" value={inboundModel} onChange={e=>setInboundModel(e.target.value)} /><p className="text-xs text-gray-500">新增後請在下方列表新增料件</p></div>)}
                    {modalType !== 'ADD_MODEL' && (
                        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                            {modalType === 'REPAIR' ? (
                                <div className="space-y-4"><div className="bg-amber-50 p-4 rounded border border-amber-100 text-sm"><div className="grid grid-cols-2 gap-2 mb-2"><div><span className="text-gray-500">契約:</span> {modalItem.ContractID}</div><div><span className="text-gray-500">批次:</span> {modalItem.Batch}</div><div><span className="text-gray-500">廠牌:</span> {modalItem.Brand}</div><div><span className="text-gray-500">機型:</span> {modalItem.Model}</div></div><div className="font-bold text-lg border-t border-amber-200 pt-2">{modalItem.PartName}</div><div className="mt-1">當前剩餘: <span className="font-mono text-blue-600 font-bold">{modalItem.Balance}</span></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-gray-500 block mb-1">送修日期</label><input type="date" className="w-full border p-2 rounded" value={formDate} onChange={e=>setFormDate(e.target.value)} /></div><div><label className="text-xs text-gray-500 block mb-1">送修數量</label><div className="flex items-center gap-2"><button onClick={()=>handleRepairQtyChange(-1, modalItem.Balance)} className="p-2 bg-gray-200 rounded hover:bg-gray-300"><Minus size={16}/></button><input type="number" className="w-full border p-2 rounded text-center font-bold" value={repairQty} onChange={e=>setRepairQty(parseInt(e.target.value)||0)} /><button onClick={()=>handleRepairQtyChange(1, modalItem.Balance)} className="p-2 bg-gray-200 rounded hover:bg-gray-300"><Plus size={16}/></button></div></div></div><div><label className="text-xs text-gray-500 block mb-1">備註</label><input className="w-full border p-2 rounded" placeholder="故障原因 / 送修單號" value={formNote} onChange={e=>setFormNote(e.target.value)} /></div></div>
                            ) : (
                                <><div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-shrink-0 bg-gray-50 p-3 rounded"><div className="col-span-1"><label className="text-xs text-gray-500">日期</label><input type="date" className="w-full border p-1 rounded bg-white" value={formDate} onChange={e=>setFormDate(e.target.value)} /></div><div className="col-span-1"><label className="text-xs text-gray-500">契約編號</label><input className={`w-full border p-1 rounded ${modalType==='ADD_INBOUND'?'bg-white':'bg-gray-200'}`} value={formContractID} onChange={e=>setFormContractID(e.target.value)} readOnly={modalType!=='ADD_INBOUND'} placeholder="Contract ID"/></div><div className="col-span-1"><label className="text-xs text-gray-500">批次</label><input className={`w-full border p-1 rounded ${modalType==='ADD_INBOUND'?'bg-white':'bg-gray-200'}`} value={formBatch} onChange={e=>setFormBatch(e.target.value)} readOnly={modalType!=='ADD_INBOUND'} placeholder="Batch"/></div>{modalType === 'OUT' && (<><div className="col-span-2 md:col-span-3 grid grid-cols-3 gap-3"><div className="col-span-1"><label className="text-xs text-gray-500 text-purple-600 font-bold">工程編號</label><input className="w-full border p-1 rounded bg-white border-purple-300 focus:ring-purple-500" value={formProjectID} onChange={e=>setFormProjectID(e.target.value)} placeholder="必填" autoFocus/></div><div className="col-span-2"><label className="text-xs text-gray-500">地點</label><input className="w-full border p-1 rounded bg-white" value={formLocation} onChange={e=>setFormLocation(e.target.value)} placeholder="施工地點/備註"/></div></div></>)}</div><div className="grid grid-cols-2 gap-3 flex-shrink-0"><div><label className="text-xs text-gray-500 block mb-1">廠牌</label>{modalType === 'ADD_INBOUND' ? (<select className="w-full border p-2 rounded bg-white" value={inboundBrand} onChange={e=>{setInboundBrand(e.target.value);setInboundModel("");setPartQuantities({})}}><option value="">請選擇廠牌</option>{uniqueBrands.map(b=><option key={b} value={b}>{b}</option>)}</select>) : (<input className="w-full border p-2 rounded bg-gray-200 cursor-not-allowed" value={inboundBrand} readOnly />)}</div><div><label className="text-xs text-gray-500 block mb-1">機型</label>{modalType === 'ADD_INBOUND' ? (<select className="w-full border p-2 rounded bg-white" value={inboundModel} onChange={e=>{setInboundModel(e.target.value);setPartQuantities({})}} disabled={!inboundBrand}><option value="">请先選廠牌</option>{getModelsByBrand(inboundBrand).map(m=><option key={m} value={m}>{m}</option>)}</select>) : (<input className="w-full border p-2 rounded bg-gray-200 cursor-not-allowed" value={inboundModel} readOnly />)}</div></div><div className="flex-1 overflow-auto border rounded bg-white"><div className="sticky top-0 bg-gray-100 border-b p-2 grid grid-cols-12 text-xs font-bold text-gray-500"><span className="col-span-4">料件名稱</span><span className="col-span-3 text-center">{modalType==='OUT'?'庫存 / 預設':'參考量'}</span><span className="col-span-5 text-center">{modalType==='ADD_INBOUND'?'進料數量':'消耗數量'}</span></div>{(modalType==='ADD_INBOUND' ? availablePartsForInbound : availablePartsForOutbound).length > 0 ? (<div className="divide-y">{(modalType==='ADD_INBOUND' ? availablePartsForInbound : availablePartsForOutbound).map((part, idx) => {const currentStock = currentStockMap[part.PartName] || 0;const maxLimit = (modalType==='OUT') ? currentStock : null;return (<div key={idx} className="p-2 grid grid-cols-12 items-center hover:bg-gray-50"><span className="col-span-4 font-bold text-gray-700 truncate" title={part.PartName}>{part.PartName}</span><div className="col-span-3 text-center text-xs text-gray-500">{modalType === 'OUT' ? (<span>庫存:<span className={currentStock===0?'text-red-500 font-bold':''}>{currentStock}</span></span>) : (<span>-</span>)}</div><div className="col-span-5 flex items-center justify-center gap-2"><button onClick={()=>handleQtyChange(part.PartName, -1, maxLimit)} className="p-1 rounded bg-gray-200 hover:bg-gray-300 active:bg-gray-400"><Minus size={16}/></button><input type="number" className="w-16 border rounded text-center font-mono text-lg font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={partQuantities[part.PartName] || 0} onChange={(e) => handleManualQtyChange(part.PartName, e.target.value, maxLimit)} onFocus={(e) => e.target.select()} /><button onClick={()=>handleQtyChange(part.PartName, 1, maxLimit)} className={`p-1 rounded bg-gray-200 hover:bg-gray-300 active:bg-gray-400 ${modalType==='OUT' && (partQuantities[part.PartName]||0)>=currentStock ? 'opacity-30 cursor-not-allowed':''}`} disabled={modalType==='OUT' && (partQuantities[part.PartName]||0)>=currentStock}><Plus size={16}/></button></div></div>);})}</div>) : (<div className="p-10 text-center text-gray-400">請先選擇有效的廠牌與機型</div>)}</div></>
                            )}
                        </div>
                    )}
                    <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-4 hover:bg-blue-700 shadow flex-shrink-0">確認送出</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;