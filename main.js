// Initialize VANTA globe
VANTA.GLOBE({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0x1f8a1f,
    color2: 0x0,
    backgroundColor: 0x000000
});

// Function to fetch CSV and parse
async function fetchCSV() {
    const response = await fetch('data/latest_data.csv');
    const text = await response.text();
    return text.split('\n').slice(1).map(row => {
        const [name, earnedKP, targetRate] = row.split(',');
        return {
            name: name.trim(),
            earnedKP: parseInt(earnedKP),
            targetRate: parseFloat(targetRate) * 100
        };
    });
}

// Function to create a chart
function createChart(ctx, data, color) {
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Target Rate %',
                data: data.map(d => d.targetRate),
                backgroundColor: data.map(d => color(d.targetRate))
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const d = data[context.dataIndex];
                            return `${d.name}: ${d.earnedKP.toLocaleString()} KP, ${d.targetRate.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 250,
                    title: {
                        display: true,
                        text: 'Target Rate %'
                    }
                }
            }
        }
    });
}

// Color functions
const coreColor = t => 'green';
const goodColor = t => 'lightgreen';
const warningColor = t => 'orange';
const criticalColor = t => 'red';

// Filter categories
function categorizeData(data) {
    return {
        core: data.filter(d => d.targetRate >= 200),
        good: data.filter(d => d.targetRate >= 100 && d.targetRate < 200),
        warning: data.filter(d => d.targetRate >= 50 && d.targetRate < 100),
        critical: data.filter(d => d.targetRate < 50)
    };
}

// Main function
async function init() {
    const data = await fetchCSV();
    const categories = categorizeData(data);

    createChart(document.getElementById('chartCore').getContext('2d'), categories.core, coreColor);
    createChart(document.getElementById('chartGood').getContext('2d'), categories.good, goodColor);
    createChart(document.getElementById('chartWarning').getContext('2d'), categories.warning, warningColor);
    createChart(document.getElementById('chartCritical').getContext('2d'), categories.critical, criticalColor);
}

init();
