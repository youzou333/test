const form = document.getElementById('entryForm');
const tbody = document.querySelector('#logTable tbody');
const summary = document.getElementById('summary');
const logs = [];

const fmt = (n) => Number(n).toFixed(1);

function render() {
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${l.date}</td><td>${fmt(l.weight)}</td><td>${l.bcs}</td><td>${l.mcs}</td>
      <td>${l.kcal || ''}</td><td>${l.treatKcal || ''}</td><td>${l.exerciseMin || ''}</td>
      <td>${l.stoolScore || ''}</td><td>${l.memo || ''}</td>
    </tr>
  `).join('');

  if (!logs.length) {
    summary.innerHTML = '<li>まだ記録がありません。</li>';
    return;
  }

  const latest = logs[logs.length - 1];
  const avgWeight = logs.reduce((a,b) => a + b.weight, 0) / logs.length;
  const avgBCS = logs.reduce((a,b) => a + b.bcs, 0) / logs.length;
  const avgTreatRatio = logs
    .filter(l => l.kcal > 0 && l.treatKcal >= 0)
    .map(l => (l.treatKcal || 0) / l.kcal * 100);
  const treatRatio = avgTreatRatio.length ? avgTreatRatio.reduce((a,b)=>a+b,0)/avgTreatRatio.length : 0;

  let bcsMessage = '理想ゾーン(4-5/9)です。';
  if (latest.bcs < 4) bcsMessage = 'やせ気味の可能性があります。';
  if (latest.bcs > 5) bcsMessage = '太り気味の可能性があります。';

  summary.innerHTML = `
    <li>最新体重: <strong>${fmt(latest.weight)} kg</strong></li>
    <li>平均体重: <strong>${fmt(avgWeight)} kg</strong> / 平均BCS: <strong>${avgBCS.toFixed(1)}</strong></li>
    <li>BCS判定: <strong>${bcsMessage}</strong></li>
    <li>おやつ比率の平均: <strong>${treatRatio.toFixed(1)}%</strong>（目安: 10%以下）</li>
  `;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    date: document.getElementById('date').value,
    weight: Number(document.getElementById('weight').value),
    bcs: Number(document.getElementById('bcs').value),
    mcs: document.getElementById('mcs').value,
    kcal: Number(document.getElementById('kcal').value) || 0,
    treatKcal: Number(document.getElementById('treatKcal').value) || 0,
    exerciseMin: Number(document.getElementById('exerciseMin').value) || 0,
    stoolScore: Number(document.getElementById('stoolScore').value) || '',
    memo: document.getElementById('memo').value.trim()
  };
  logs.push(data);
  render();
  form.reset();
});

render();
