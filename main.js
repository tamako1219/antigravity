import './style.css'
import { Background3D } from './src/background3d.js';

// Initialize 3D Background
new Background3D();

// --- Toast Notification ---
const showToast = (message) => {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 0.9rem;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 100;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2000);
};

// --- Data Store ---
class DataStore {
  constructor() {
    this.STORAGE_KEY = 'drivesync_data';
    this.data = this.load();
  }

  load() {
    const json = localStorage.getItem(this.STORAGE_KEY);
    let data = json ? JSON.parse(json) : null;

    // Initial State
    if (!data) {
      const initialCarId = crypto.randomUUID();
      return {
        activeCarId: initialCarId,
        cars: [{
          id: initialCarId,
          name: 'My Car',
          odometer: 0,
          fuelLogs: [],
          maintenanceLogs: []
        }]
      };
    }

    // Migration: Old format to Multi-Car format
    if (!data.cars) {
      console.log("Migrating data to multi-car format...");
      const migratedCarId = crypto.randomUUID();
      data = {
        activeCarId: migratedCarId,
        cars: [{
          id: migratedCarId,
          name: data.carName || 'My Car',
          odometer: data.odometer || 0,
          fuelLogs: data.fuelLogs || [],
          maintenanceLogs: data.maintenanceLogs || []
        }]
      };
      this.save(data);
    }

    return data;
  }

  save(data = this.data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  get activeCar() {
    return this.data.cars.find(c => c.id === this.data.activeCarId) || this.data.cars[0];
  }

  addCar(name, odometer) {
    const newCar = {
      id: crypto.randomUUID(),
      name: name,
      odometer: parseInt(odometer) || 0,
      fuelLogs: [],
      maintenanceLogs: []
    };
    this.data.cars.push(newCar);
    this.data.activeCarId = newCar.id;
    this.save();
  }

  switchCar(carId) {
    if (this.data.cars.find(c => c.id === carId)) {
      this.data.activeCarId = carId;
      this.save();
    }
  }

  updateCarProfile(name, odometer) {
    const car = this.activeCar;
    car.name = name;
    car.odometer = parseInt(odometer);
    this.save();
  }

  addFuelLog(log) {
    const car = this.activeCar;
    car.fuelLogs.push({ id: Date.now(), ...log });
    car.fuelLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (log.odometer > car.odometer) {
      car.odometer = log.odometer;
    }
    this.save();
  }

  addMaintenanceLog(log) {
    const car = this.activeCar;
    car.maintenanceLogs.push({ id: Date.now(), ...log });
    car.maintenanceLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.save();
  }

  calculateStats() {
    const car = this.activeCar;
    const logs = car.fuelLogs;
    if (logs.length < 2) return { avgKmL: 0, totalCost: 0 };

    let totalCost = logs.reduce((sum, log) => sum + (log.price || 0), 0);

    let validIntervals = 0;
    let sumKmL = 0;

    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      const dist = current.odometer - prev.odometer;
      if (dist > 0 && current.liters > 0) {
        sumKmL += (dist / current.liters);
        validIntervals++;
      }
    }

    return {
      avgKmL: validIntervals > 0 ? (sumKmL / validIntervals).toFixed(2) : 0,
      totalCost
    };
  }

  getMaintenanceAlerts() {
    const car = this.activeCar;
    if (!car.maintenanceLogs.length) return [];

    const lastMaint = car.maintenanceLogs[0];
    const alerts = [];
    const distDiff = car.odometer - lastMaint.odometer;
    const timeDiff = new Date() - new Date(lastMaint.date);
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (distDiff >= 5000) {
      alerts.push({ type: 'distance', msg: `前回の整備から${distDiff}km走行しました` });
    }
    if (daysDiff >= 180) { // 6 months
      alerts.push({ type: 'time', msg: `前回の整備から6ヶ月以上経過しました` });
    }
    return alerts;
  }

  exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data));
    this._downloadFile(dataStr, "drivesync_full_backup_" + new Date().toISOString().slice(0, 10) + ".json");
  }

  exportCarData(carId) {
    const car = this.data.cars.find(c => c.id === carId);
    if (!car) return;

    const exportData = {
      type: 'single_car',
      car: car
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    this._downloadFile(dataStr, `drivesync_${car.name}_${new Date().toISOString().slice(0, 10)}.json`);
  }

  _downloadFile(dataStr, fileName) {
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  importData(jsonString) {
    try {
      const newData = JSON.parse(jsonString);

      // Case 1: Single Car Import
      if (newData.type === 'single_car' && newData.car) {
        const importedCar = newData.car;
        // Check if car already exists (by ID)
        const existingIndex = this.data.cars.findIndex(c => c.id === importedCar.id);

        if (existingIndex >= 0) {
          // Update existing
          if (confirm(`「${importedCar.name}」のデータが見つかりました。上書きしますか？`)) {
            this.data.cars[existingIndex] = importedCar;
            this.save();
            return true;
          }
          return false; // User cancelled
        } else {
          // Add as new
          this.data.cars.push(importedCar);
          this.data.activeCarId = importedCar.id; // Switch to imported car
          this.save();
          return true;
        }
      }

      // Case 2: Full Backup Import (Multi-Car format)
      if (newData.cars && Array.isArray(newData.cars)) {
        if (confirm('すべてのデータを上書きしてもよろしいですか？現在のデータは失われます。')) {
          this.data = newData;
          this.save();
          return true;
        }
        return false;
      }

      // Case 3: Legacy Import (Old format)
      if (newData.fuelLogs && !newData.cars) {
        const newCarId = crypto.randomUUID();
        const newCar = {
          id: newCarId,
          name: newData.carName || 'Imported Car',
          odometer: newData.odometer || 0,
          fuelLogs: newData.fuelLogs,
          maintenanceLogs: newData.maintenanceLogs || []
        };
        this.data.cars.push(newCar);
        this.data.activeCarId = newCarId;
        this.save();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }
}

// --- Views ---
const Views = {
  dashboard: (store) => {
    const car = store.activeCar;
    const stats = store.calculateStats();
    const lastMaint = car.maintenanceLogs[0]; // Newest
    const alerts = store.getMaintenanceAlerts();

    const alertsHtml = alerts.map(a => `
      <div style="background:rgba(255, 50, 50, 0.2); border:1px solid rgba(255, 50, 50, 0.5); color:#ff9999; padding:10px; border-radius:12px; margin-bottom:10px; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
        <span>⚠️</span> ${a.msg}
      </div>
    `).join('');

    return `
      <div class="card">
        <h2 style="display:flex; justify-content:space-between; align-items:center;">
          ${car.name}
          <span style="font-size:0.8rem; color:var(--primary-color); border:1px solid var(--primary-color); padding:2px 8px; border-radius:12px;">Active</span>
        </h2>
        ${alertsHtml}
        <div class="stat-grid">
          <div class="stat-item">
            <div class="stat-value">${parseInt(car.odometer).toLocaleString()}</div>
            <div class="stat-label">走行距離 (km)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.avgKmL}</div>
            <div class="stat-label">平均燃費 (km/L)</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>燃費トレンド</h3>
        <canvas id="fuelChart" height="200"></canvas>
      </div>
      
      <div class="card">
        <h3>最新のアクティビティ</h3>
        ${lastMaint ? `
          <div class="list-item">
            <div class="list-item-main">🔧 ${lastMaint.type}</div>
            <div class="list-item-sub">${lastMaint.date} - ${lastMaint.odometer}km</div>
          </div>
        ` : '<p style="color:var(--text-muted); font-size:0.875rem;">整備記録はまだありません。</p>'}
      </div>
      
      <button id="btn-add-fuel-shortcut" class="btn btn-primary btn-fab">+</button>
    `;
  },

  fuel: (store) => {
    const car = store.activeCar;
    const logsHtml = car.fuelLogs.map(log => `
      <div class="list-item">
        <div>
          <div class="list-item-main">${log.date}</div>
          <div class="list-item-sub">${log.liters}L @ ¥${log.price}</div>
        </div>
        <div style="text-align:right;">
          <div class="list-item-main">${log.odometer} km</div>
          <div class="list-item-sub">${log.isFull ? '満タン' : '通常'}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="card">
        <h3>給油記録の追加 (${car.name})</h3>
        <form id="fuel-form">
          <div class="form-group">
            <label>日付</label>
            <input type="date" name="date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label>走行距離 (km)</label>
            <input type="number" name="odometer" class="form-control" required value="${car.odometer}" min="${car.odometer}">
          </div>
          <div class="stat-grid">
            <div class="form-group">
              <label>給油量 (L)</label>
              <input type="number" name="liters" step="0.01" class="form-control" required>
            </div>
            <div class="form-group">
              <label>合計金額 (円)</label>
              <input type="number" name="price" class="form-control">
            </div>
          </div>
          <div class="form-group">
             <label><input type="checkbox" name="isFull" checked> 満タン給油</label>
          </div>
          <button type="submit" class="btn btn-primary">保存</button>
        </form>
      </div>
      
      <div class="card">
        <h3>履歴</h3>
        <div class="log-list">
          ${logsHtml || '<p style="padding:1rem; text-align:center; color:var(--text-muted);">記録はまだありません。</p>'}
        </div>
      </div>
    `;
  },

  maintenance: (store) => {
    const car = store.activeCar;
    const logsHtml = car.maintenanceLogs.map(log => `
      <div class="list-item">
        <div>
          <div class="list-item-main">${log.type}</div>
          <div class="list-item-sub">${log.date}</div>
        </div>
        <div style="text-align:right;">
          <div class="list-item-main">¥${(log.cost || 0).toLocaleString()}</div>
          <div class="list-item-sub">${log.odometer} km</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="card">
        <h3>整備記録の追加 (${car.name})</h3>
        <form id="maint-form">
          <div class="form-group">
            <label>種類</label>
            <select name="type" class="form-control">
              <option value="オイル交換">オイル交換</option>
              <option value="タイヤ交換/ローテーション">タイヤ交換/ローテーション</option>
              <option value="車検/点検">車検/点検</option>
              <option value="バッテリー交換">バッテリー交換</option>
              <option value="ワイパー交換">ワイパー交換</option>
              <option value="その他">その他</option>
            </select>
          </div>
          <div class="form-group">
            <label>日付</label>
            <input type="date" name="date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="stat-grid">
            <div class="form-group">
              <label>走行距離 (km)</label>
              <input type="number" name="odometer" class="form-control" required value="${car.odometer}">
            </div>
            <div class="form-group">
              <label>費用 (円)</label>
              <input type="number" name="cost" class="form-control" placeholder="0">
            </div>
          </div>
          <div class="form-group">
            <label>メモ</label>
            <input type="text" name="note" class="form-control" placeholder="備考（任意）">
          </div>
          <button type="submit" class="btn btn-primary">保存</button>
        </form>
      </div>
      
      <div class="card">
        <h3>履歴</h3>
        <div class="log-list">
          ${logsHtml || '<p style="padding:1rem; text-align:center; color:var(--text-muted);">記録はまだありません。</p>'}
        </div>
      </div>
    `;
  },

  settings: (store) => {
    const car = store.activeCar;
    const carListHtml = store.data.cars.map(c => `
      <div class="list-item" onclick="window.app.switchCar('${c.id}')" style="cursor:pointer;">
        <div class="list-item-main" style="${c.id === store.data.activeCarId ? 'color:var(--primary-color); font-weight:bold;' : ''}">
          ${c.name} ${c.id === store.data.activeCarId ? ' (Active)' : ''}
        </div>
        <div class="list-item-sub">${c.odometer} km</div>
      </div>
    `).join('');

    const exportListHtml = store.data.cars.map(c => `
      <div class="list-item">
        <div class="list-item-main">${c.name}</div>
        <button class="btn btn-sm" onclick="window.app.exportCar('${c.id}')" style="width:auto; padding: 8px 16px; font-size:0.8rem; background:var(--secondary-color);">共有 (Export)</button>
      </div>
    `).join('');

    return `
      <div class="card">
        <h3>車両切り替え</h3>
        <div class="log-list" style="margin-bottom: 1rem;">
          ${carListHtml}
        </div>
        <button id="btn-add-car-toggle" class="btn" style="background:var(--glass-bg); border:1px solid var(--glass-border);">+ 新しい車を追加</button>
        
        <form id="add-car-form" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--glass-border);">
          <div class="form-group">
            <label>車の名前</label>
            <input type="text" name="newCarName" class="form-control" required placeholder="例: 妻の車">
          </div>
          <div class="form-group">
            <label>現在の走行距離</label>
            <input type="number" name="newCarOdometer" class="form-control" required value="0">
          </div>
          <button type="submit" class="btn btn-primary">追加</button>
        </form>
      </div>

      <div class="card">
        <h3>車両プロフィール (${car.name})</h3>
        <form id="settings-form">
          <div class="form-group">
            <label>愛車の名前</label>
            <input type="text" name="carName" class="form-control" value="${car.name}">
          </div>
          <div class="form-group">
            <label>現在の走行距離 (km)</label>
            <input type="number" name="odometer" class="form-control" value="${car.odometer}">
          </div>
          <button type="submit" class="btn btn-primary">更新</button>
        </form>
      </div>
      
      <div class="card">
        <h3>データ共有・バックアップ</h3>
        <p style="margin-bottom:1rem; color:var(--text-muted); font-size:0.9rem;">
          特定の車のデータだけを書き出して、パートナーに送ることができます。
        </p>
        
        <h4 style="margin-bottom:0.5rem; font-size:1rem;">車両ごとの書き出し</h4>
        <div class="log-list" style="margin-bottom: 1.5rem;">
          ${exportListHtml}
        </div>

        <h4 style="margin-bottom:0.5rem; font-size:1rem;">全体バックアップ</h4>
        <button id="btn-export" class="btn" style="background:#334155; color:white; margin-bottom:1rem;">すべてのデータを書き出し</button>
        
        <h4 style="margin-bottom:0.5rem; font-size:1rem;">データの読み込み</h4>
        <div class="file-input-wrapper">
          <button class="btn" style="background:var(--glass-bg); border:1px solid var(--glass-border);" onclick="document.getElementById('file-import').click()">📂 ファイルを選択して読み込む</button>
          <input type="file" id="file-import" accept=".json" style="display:none;">
        </div>
      </div>
    `;
  }
};

// --- App Logic ---
class App {
  constructor() {
    this.store = new DataStore();
    this.currentView = 'dashboard';
    window.app = this; // Expose for inline onclick handlers
    this.init();
  }

  init() {
    this.setupNavigation();
    this.render();
  }

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Remove active class from all
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        // Add to clicked
        const target = e.currentTarget;
        target.classList.add('active');

        // Switch view
        const viewId = target.dataset.target; // view-dashboard
        this.currentView = viewId.replace('view-', '');
        this.render();
      });
    });
  }

  switchCar(carId) {
    this.store.switchCar(carId);
    showToast('車両を切り替えました');
    this.render();
  }

  exportCar(carId) {
    this.store.exportCarData(carId);
    showToast('データを書き出しました');
  }

  render() {
    // Hide all views
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));

    // Show current view container
    const container = document.getElementById(`view-${this.currentView}`);
    if (container) {
      container.classList.add('active');
      // Render content
      container.innerHTML = Views[this.currentView](this.store);
      this.attachListeners(container);

      // Render Chart if on Dashboard
      if (this.currentView === 'dashboard') {
        this.renderChart(container);
      }
    }

    // Update Header Title
    const titles = {
      dashboard: 'ダッシュボード',
      fuel: '給油記録',
      maintenance: '整備記録',
      settings: '設定'
    };
    document.getElementById('page-title').textContent = titles[this.currentView];
  }

  renderChart(container) {
    const ctx = container.querySelector('#fuelChart');
    if (!ctx) return;

    const car = this.store.activeCar;
    const logs = [...car.fuelLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate KmL for each interval
    const labels = [];
    const dataPoints = [];

    for (let i = 1; i < logs.length; i++) {
      const current = logs[i];
      const prev = logs[i - 1];
      const dist = current.odometer - prev.odometer;
      if (dist > 0 && current.liters > 0) {
        const kmL = dist / current.liters;
        labels.push(current.date.slice(5)); // MM-DD
        dataPoints.push(kmL.toFixed(1));
      }
    }

    if (dataPoints.length === 0) {
      ctx.style.display = 'none';
      return;
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '燃費 (km/L)',
          data: dataPoints,
          borderColor: '#00d2ff',
          backgroundColor: 'rgba(0, 210, 255, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ff00cc',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: 'rgba(255,255,255,0.7)' }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.7)' }
          }
        }
      }
    });
  }

  attachListeners(container) {
    // Dashboard Shortcut
    const shortcutBtn = container.querySelector('#btn-add-fuel-shortcut');
    if (shortcutBtn) {
      shortcutBtn.addEventListener('click', () => {
        this.currentView = 'fuel';
        // Update nav
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-target="view-fuel"]').classList.add('active');
        this.render();
      });
    }

    // Fuel Form
    const fuelForm = container.querySelector('#fuel-form');
    if (fuelForm) {
      fuelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(fuelForm);
        this.store.addFuelLog({
          date: formData.get('date'),
          odometer: parseInt(formData.get('odometer')),
          liters: parseFloat(formData.get('liters')),
          price: parseInt(formData.get('price')) || 0,
          isFull: formData.get('isFull') === 'on'
        });
        showToast('給油記録を保存しました！');
        this.render(); // Re-render to show list
      });
    }

    // Maintenance Form
    const maintForm = container.querySelector('#maint-form');
    if (maintForm) {
      maintForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(maintForm);
        this.store.addMaintenanceLog({
          type: formData.get('type'),
          date: formData.get('date'),
          odometer: parseInt(formData.get('odometer')),
          cost: parseInt(formData.get('cost')) || 0,
          note: formData.get('note')
        });
        showToast('整備記録を保存しました！');
        this.render();
      });
    }

    // Settings: Add Car Toggle
    const addCarToggle = container.querySelector('#btn-add-car-toggle');
    if (addCarToggle) {
      addCarToggle.addEventListener('click', () => {
        const form = container.querySelector('#add-car-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
      });
    }

    // Settings: Add Car Form
    const addCarForm = container.querySelector('#add-car-form');
    if (addCarForm) {
      addCarForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(addCarForm);
        this.store.addCar(
          formData.get('newCarName'),
          formData.get('newCarOdometer')
        );
        showToast('新しい車を追加しました！');
        this.render();
      });
    }

    // Settings Form
    const settingsForm = container.querySelector('#settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(settingsForm);
        this.store.updateCarProfile(
          formData.get('carName'),
          formData.get('odometer')
        );
        showToast('設定を更新しました！');
      });
    }

    // Export
    const exportBtn = container.querySelector('#btn-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.store.exportData();
      });
    }

    // Import
    const importInput = container.querySelector('#file-import');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const success = this.store.importData(e.target.result);
          if (success) {
            showToast('データを読み込みました！');
            this.render();
          } else {
            alert('データの読み込みに失敗しました。形式が正しくありません。');
          }
        };
        reader.readAsText(file);
      });
    }
  }
}

// Start App
new App();

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW registration failed:', err));
  });
}
