const storeKey = "petWeightNotebook:v1";

const state = {
  petName: "コタロー",
  records: []
};

const els = {
  form: document.querySelector("#recordForm"),
  petName: document.querySelector("#petName"),
  date: document.querySelector("#dateInput"),
  weight: document.querySelector("#weightInput"),
  meal: document.querySelector("#mealInput"),
  poop: document.querySelector("#poopInput"),
  memo: document.querySelector("#memoInput"),
  currentWeight: document.querySelector("#currentWeight"),
  trendStatus: document.querySelector("#trendStatus"),
  chart: document.querySelector("#weightChart"),
  deltaWeight: document.querySelector("#deltaWeight"),
  averageWeight: document.querySelector("#averageWeight"),
  recordCount: document.querySelector("#recordCount"),
  careAdvice: document.querySelector("#careAdvice"),
  historyList: document.querySelector("#historyList"),
  sampleButton: document.querySelector("#sampleButton"),
  reminderButton: document.querySelector("#reminderButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  clearButton: document.querySelector("#clearButton"),
  printButton: document.querySelector("#printButton"),
  toast: document.querySelector("#toast")
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function load() {
  const saved = localStorage.getItem(storeKey);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.petName = parsed.petName || state.petName;
    state.records = Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    showToast("保存データを読み込めませんでした。");
  }
}

function save() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function sortRecords(records = state.records) {
  return [...records].sort((a, b) => a.date.localeCompare(b.date));
}

function latestRecords() {
  return sortRecords().reverse();
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function formatWeight(value) {
  return Number(value).toFixed(2);
}

function getCareValues(formData) {
  return formData.getAll("care");
}

function render() {
  els.petName.value = state.petName;
  renderSummary();
  renderChart();
  renderHistory();
}

function renderSummary() {
  const records = sortRecords();
  const latest = records.at(-1);
  const previous = records.at(-2);

  els.currentWeight.textContent = latest ? formatWeight(latest.weight) : "--";
  els.recordCount.textContent = `${records.length}日`;

  if (!latest) {
    els.deltaWeight.textContent = "--";
    els.averageWeight.textContent = "--";
    els.trendStatus.textContent = "記録を入れると判定します";
    els.trendStatus.classList.remove("good");
    els.careAdvice.textContent = "体重、ごはん、うんちをまとめて残すと、病院で説明しやすくなります。";
    return;
  }

  if (previous) {
    const delta = latest.weight - previous.weight;
    els.deltaWeight.textContent = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} kg`;
    const rate = Math.abs(delta) / previous.weight;
    if (rate >= 0.05) {
      els.trendStatus.textContent = "大きな変化があります";
      els.trendStatus.classList.remove("good");
      els.careAdvice.textContent = "前回から5%以上変わっています。食欲やうんちの様子も一緒に確認しましょう。";
    } else {
      els.trendStatus.textContent = "ゆるやかな変化です";
      els.trendStatus.classList.add("good");
      els.careAdvice.textContent = "急な増減は見られません。いつもの記録を続けましょう。";
    }
  } else {
    els.deltaWeight.textContent = "--";
    els.trendStatus.textContent = "最初の記録ができました";
    els.trendStatus.classList.add("good");
    els.careAdvice.textContent = "次回の体重を入れると、増えたか減ったかを自動で見ます。";
  }

  const week = records.slice(-7);
  const average = week.reduce((sum, record) => sum + record.weight, 0) / week.length;
  els.averageWeight.textContent = `${average.toFixed(2)} kg`;
}

function renderChart() {
  const canvas = els.chart;
  const ctx = canvas.getContext("2d");
  const records = sortRecords().slice(-14);
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 28, right: 26, bottom: 54, left: 58 };

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#eadfce";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const y = padding.top + ((height - padding.top - padding.bottom) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  if (records.length === 0) {
    ctx.fillStyle = "#6f675c";
    ctx.font = "700 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("記録を保存するとグラフが出ます", width / 2, height / 2);
    return;
  }

  const weights = records.map((record) => record.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = Math.max(max - min, 0.4);
  const yMin = min - range * 0.18;
  const yMax = max + range * 0.18;

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const pointFor = (record, index) => {
    const x = records.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + (plotWidth / (records.length - 1)) * index;
    const y = padding.top + (1 - (record.weight - yMin) / (yMax - yMin)) * plotHeight;
    return { x, y };
  };

  ctx.strokeStyle = "#1f7a6d";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  records.forEach((record, index) => {
    const { x, y } = pointFor(record, index);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  records.forEach((record, index) => {
    const { x, y } = pointFor(record, index);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#1f7a6d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = "#6f675c";
  ctx.font = "700 18px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${yMax.toFixed(1)}kg`, 8, padding.top + 6);
  ctx.fillText(`${yMin.toFixed(1)}kg`, 8, height - padding.bottom + 6);

  ctx.textAlign = "center";
  const first = records[0].date.slice(5).replace("-", "/");
  const last = records.at(-1).date.slice(5).replace("-", "/");
  ctx.fillText(first, padding.left, height - 18);
  ctx.fillText(last, width - padding.right, height - 18);
}

function renderHistory() {
  const records = latestRecords();
  if (records.length === 0) {
    els.historyList.innerHTML = "<p class=\"history-meta\">まだ記録がありません。まずは今日の体重を入れてください。</p>";
    return;
  }

  els.historyList.innerHTML = records.slice(0, 12).map((record) => {
    const care = record.care.length ? ` / ${record.care.join("・")}` : "";
    const memo = record.memo ? ` / ${escapeHtml(record.memo)}` : "";
    return `
      <article class="history-item">
        <time datetime="${record.date}">${formatDate(record.date)}</time>
        <div>
          <strong>${formatWeight(record.weight)} kg</strong>
          <p class="history-meta">${escapeHtml(record.meal)} / うんち ${escapeHtml(record.poop)}${escapeHtml(care)}${memo}</p>
        </div>
        <button class="delete-record" type="button" data-date="${record.date}" aria-label="${formatDate(record.date)}の記録を削除">×</button>
      </article>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2400);
}

function upsertRecord(record) {
  const index = state.records.findIndex((item) => item.date === record.date);
  if (index >= 0) state.records[index] = record;
  else state.records.push(record);
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function requestReminder() {
  const message = "毎日19時になったら、このページを開いて記録してください。スマホのカレンダーにも「うちの子 体重」と入れておくと安心です。";

  if (!("Notification" in window)) {
    showToast(message);
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("うちの子 体重手帳", { body: "今日の体重を記録する時間です。" });
    showToast("通知の見本を出しました。");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      new Notification("うちの子 体重手帳", { body: "今日の体重を記録する時間です。" });
    }
    showToast(message);
  });
}

function addSampleData() {
  const start = new Date();
  start.setDate(start.getDate() - 8);
  const weights = [5.42, 5.40, 5.38, 5.39, 5.36, 5.35, 5.34, 5.33, 5.34];

  weights.forEach((weight, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    upsertRecord({
      date: date.toISOString().slice(0, 10),
      weight,
      meal: index === 6 ? "少なめ" : "いつも通り",
      poop: "普通",
      care: index % 2 === 0 ? ["散歩"] : [],
      memo: index === 6 ? "暑くて少し残した" : ""
    });
  });

  save();
  render();
  showToast("見本の記録を入れました。");
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(els.form);
  const weight = Number(formData.get("weight"));

  if (!Number.isFinite(weight) || weight <= 0) {
    showToast("体重を正しく入れてください。");
    return;
  }

  state.petName = els.petName.value.trim() || "うちの子";
  upsertRecord({
    date: formData.get("date"),
    weight,
    meal: formData.get("meal"),
    poop: formData.get("poop"),
    care: getCareValues(formData),
    memo: formData.get("memo").trim()
  });

  save();
  render();
  els.memo.value = "";
  els.form.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = false;
  });
  showToast("今日の記録を保存しました。");
});

els.petName.addEventListener("change", () => {
  state.petName = els.petName.value.trim() || "うちの子";
  save();
});

els.historyList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-record");
  if (!button) return;

  state.records = state.records.filter((record) => record.date !== button.dataset.date);
  save();
  render();
  showToast("記録を削除しました。");
});

els.sampleButton.addEventListener("click", addSampleData);
els.reminderButton.addEventListener("click", requestReminder);
els.printButton.addEventListener("click", () => window.print());

els.exportButton.addEventListener("click", () => {
  downloadJson(`${state.petName || "pet"}-weight-records.json`, state);
  showToast("記録ファイルを作りました。");
});

els.importInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    state.petName = parsed.petName || state.petName;
    state.records = Array.isArray(parsed.records) ? parsed.records : state.records;
    save();
    render();
    showToast("記録を読み込みました。");
  } catch {
    showToast("読み込みできませんでした。");
  } finally {
    event.target.value = "";
  }
});

els.clearButton.addEventListener("click", () => {
  const ok = window.confirm("保存した記録をすべて消します。よろしいですか？");
  if (!ok) return;

  state.records = [];
  save();
  render();
  showToast("記録を消しました。");
});

load();
els.date.value = todayString();
render();
