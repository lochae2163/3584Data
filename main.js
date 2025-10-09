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
    try {
        const response = await fetch('data/latest_data.csv');
        if (!response.ok) throw new Error('Failed to fetch CSV');
        const text = await response.text();
        return text.split('\n').slice(1).filter(row => row.trim()).map(row => {
            const [name, earnedKP, targetRate] = row.split(',');
            return {
                name: name.trim(),
                earnedKP: parseInt(earnedKP) || 0,
                targetRate: parseFloat(targetRate) * 100 || 0
            };
        });
    } catch (error) {
        console.error('Error fetching CSV:', error);
        document.getElementById('loading').innerText = 'Error loading data. Please try again.';
        return [];
    }
}

// Function to create gradient color
function createGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Match canvas height
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

// Function to create a scatter chart with gradient
function createChart(ctx, data, baseColor, category) {
    // Sort data by targetRate ascending
    data.sort((a, b) => a.targetRate - b.targetRate);

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `Target Rate % (${category})`,
                data: data.map(d => ({ x: d.targetRate, y: d.earnedKP / 1000000 })),
                backgroundColor: ctx => createGradient(ctx.chart.ctx, baseColor.start, baseColor.end),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutCubic'
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            const d = data[context.dataIndex];
                            return `${d.name}: ${d.earnedKP.toLocaleString()} KP, ${d.targetRate.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Target Rate',
                        color: '#ffffff',
                        font: { size: 14 }
                    },
                    ticks: {
                        callback: function(value) { return value + '%'; },
                        color: '#ffffff',
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Earned KP (Millions)',
                        color: '#ffffff',
                        font: { size: 14 }
                    },
                    ticks: {
                        callback: function(value) { return value + 'M'; },
                        color: '#ffffff',
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Function to populate the governors table with color-coded data
function populateTable(data) {
    const tbody = document.getElementById('table-body');
    if (tbody) {
        tbody.innerHTML = ''; // Clear existing rows
        data.forEach(d => {
            const row = document.createElement('tr');
            const category = d.targetRate >= 200 ? 'Core' :
                            d.targetRate >= 100 ? 'Good' :
                            d.targetRate >= 50 ? 'Warning' : 'Critical';
            const categoryColor = d.targetRate >= 200 ? '#22c55e' : // Core
                                 d.targetRate >= 100 ? '#74d128' : // Good
                                 d.targetRate >= 50 ? '#eab308' : '#ef4444'; // Warning, Critical
            row.innerHTML = `
                <td style="color: ${categoryColor}">${d.name}</td>
                <td style="color: ${categoryColor}">${d.earnedKP.toLocaleString()}</td>
                <td style="color: ${categoryColor}">${d.targetRate.toFixed(2)}%</td>
                <td><span class="category-${category.toLowerCase()}">${category}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Filter categories
function categorizeData(data) {
    return {
        core: data.filter(d => d.targetRate >= 200),
        good: data.filter(d => d.targetRate >= 100 && d.targetRate < 200),
        warning: data.filter(d => d.targetRate >= 50 && d.targetRate < 100),
        critical: data.filter(d => d.targetRate < 50)
    };
}

// Color definitions with gradients
const colors = {
    core: { start: 'rgba(0, 100, 0, 0.9)', end: 'rgba(0, 255, 0, 0.6)' }, // Dark green to light green
    good: { start: 'rgba(144, 238, 144, 0.9)', end: 'rgba(144, 238, 144, 0.6)' }, // Light green
    warning: { start: 'rgba(255, 165, 0, 0.9)', end: 'rgba(255, 215, 0, 0.6)' }, // Orange
    critical: { start: 'rgba(255, 0, 0, 0.9)', end: 'rgba(255, 99, 71, 0.6)' } // Red
};

// Main function
async function init() {
    const loading = document.getElementById('loading');
    loading.classList.add('active');

    const data = await fetchCSV();
    loading.classList.remove('active');

    if (data.length === 0) {
        document.getElementById('loading').innerText = 'No data loaded. Check CSV file.';
        return;
    }

    // Populate the table
    populateTable(data);

    const categories = categorizeData(data);

    createChart(document.getElementById('chartCore').getContext('2d'), categories.core, colors.core, 'Core');
    createChart(document.getElementById('chartGood').getContext('2d'), categories.good, colors.good, 'Good');
    createChart(document.getElementById('chartWarning').getContext('2d'), categories.warning, colors.warning, 'Warning');
    createChart(document.getElementById('chartCritical').getContext('2d'), categories.critical, colors.critical, 'Critical');
}

init();