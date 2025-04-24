let canvas, ctx, rect, impactGraph, commonSliderValue = 50, changePercentSliderValue = 50;
const VIEWSTATES = {
    SCALE: 1,
    VIEWPORT_ORIGIN: {
        x: 0,
        y: 0,
    },
}
const MIN_ZOOM = 0.005;
const MAX_ZOOM = 4;

const mouse = {
    // Note these coordinates are adjusted for the viewport
    x: 0,
    y: 0,
    updateMouse: function (e) {
        const pos = absoluteToRelative(e.clientX, e.clientY);
        this.x = pos.x;
        this.y = pos.y;
        // console.log(this.x, this.y, states.VIEWPORT_ORIGIN);

    }
}

class EventNode {
    /**
     * 
     * @param {Number} id 
     * @param {String} name 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} diameter 
     * @param {String} color 
     */
    constructor(id, name, x, y, diameter, color = '') {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.diameter = diameter;
        this.companyNodes = [];
        if (color === '') {
            this.color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
        } else {
            this.color = color;
        }
    }

    addCompanyNode(companyNode) {
        this.companyNodes.push(companyNode);
    }

    addCompanyNodes(companyNodes) {
        this.companyNodes = this.companyNodes.concat(companyNodes);
    }

    draw() {
        // Draw company nodes in a circle around the event node, but staggered in terms of distance from the event node to avoid overlap
        const numCompanies = this.companyNodes.length;
        const radius = Math.max(this.diameter * 1.5, 100);
        const angle = 2 * Math.PI / numCompanies;
        for (let i = 0; i < numCompanies; i++) {
            const companyNode = this.companyNodes[i];
            if (i % 2 === 0) {
                companyNode.x = this.x + radius * Math.cos(i * angle);
                companyNode.y = this.y + radius * Math.sin(i * angle);
            }
            else {
                // reduce distance from event node
                companyNode.x = this.x + radius * 0.75 * Math.cos(i * angle);
                companyNode.y = this.y + radius * 0.75 * Math.sin(i * angle);
            }



            // draw line from event node to company node labeled with companyNode totalChange
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(companyNode.x, companyNode.y);

            // make hue proportional to totalChange, note that totalChange can be negative
            // red for negative, green for positive
            const calculatedHue = 100 - Math.min(100, Math.abs(companyNode.totalChange) * 250);
            if (companyNode.totalChange < 0) {
                ctx.strokeStyle = `hsla(0, ${calculatedHue}%, ${calculatedHue}%, 0.7)`;
            } else {
                ctx.strokeStyle = `hsla(120, ${calculatedHue}%, ${calculatedHue}%, 0.7)`;
            }

            // make linewidth inversely proportional to pValue
            ctx.lineWidth = Math.min(0.1 / companyNode.pValue, 20);

            ctx.stroke();
            ctx.closePath();


            // then draw company node to layer on top
            companyNode.draw();

            // then line text
            ctx.fillStyle = 'beige';
            ctx.font = '4pt Arial';
            ctx.textAlign = 'center';
            // add text at 8.5/10 of the line
            ctx.fillText(companyNode.totalChange.toFixed(2), this.x + (companyNode.x - this.x) * 0.85, this.y + (companyNode.y - this.y) * 0.85);

        }

        // bordered circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.diameter / 2, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';

        // Draw text, add a shadow effect so it's easier to read
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 2;
        // make fillstyle translucent beige
        ctx.fillStyle = 'rgba(245, 245, 220, 0.6)';
        ctx.font = '58pt Arial';
        ctx.textAlign = 'center';
        if (this.diameter > 50) {
            ctx.fillText(this.name, this.x, this.y);
        } else {
            ctx.fillText(this.name, this.x, this.y + this.diameter / 2 + 20);
        }

        // reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.closePath();





    }
}

class CompanyNode {

    constructor(id, name, x, y, width, height, ticker, totalChange, pValue, color = 'red') {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.ticker = ticker;
        this.totalChange = totalChange;
        this.pValue = pValue;
        if (color === '') {
            this.color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
        } else {
            this.color = color;
        }
    }

    draw() {
        // diamond from center of coords
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y);
        ctx.lineTo(this.x, this.y - this.height / 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw text, add a shadow effect so it's easier to read

        ctx.fillStyle = 'beige';
        ctx.font = '5pt Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.ticker, this.x, this.y - this.height / 2 + 10);

    }
}

class Edge {
    /**
     * 
     * @param {EventNode} from 
     * @param {EventNode} to 
     * @param {Number} weight
     */
    constructor(from, to, label, weight) {
        this.from = from;
        this.to = to;
        this.label = label;
        this.weight = weight;


    }

    draw() {
        ctx.strokeStyle = 'hsla(55, 85.60%, 40.80%, 0.50)';
        ctx.lineWidth = (this.weight ** 2) / 1.5;
        ctx.beginPath();
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();
        ctx.closePath();

        // add text at 5/10 of the line
        ctx.fillStyle = 'beige';
        ctx.font = '16pt Arial';
        // cut off text and add ellipsis with +n if text is too long
        const maxWords = 4;
        let text = this.label;
        if (text.split(',').length > maxWords) {
            const maxLength = text.split(',').splice(0, maxWords).join(',').length;
            text = text.substring(0, maxLength) + '\t...\t' + `+${text.split(',').length - maxWords}`;
        }
        ctx.textAlign = 'center';
        ctx.fillText(text, this.from.x + (this.to.x - this.from.x) * 0.5, this.from.y + (this.to.y - this.from.y) * 0.5);

    }
}

class ImpactGraph {
    constructor() {
        /**
         * 
         * @type {EventNode[]} 
         */
        this.nodes = [];
        /**
         * 
         * @type {Edge[]} 
         */
        this.edges = [];
    }

    /**
     * 
     * @param {EventNode} node
     * @returns {void}
     * */
    addNode(node) {
        this.nodes.push(node);
    }

    addNodes(nodes) {
        this.nodes = this.nodes.concat(nodes);
    }

    /**
     * 
     * @param {Edge} edge
     * @returns {void}
     */
    addEdge(edge) {
        this.edges.push(edge);
    }

    addEdgesByAdjacencyMatrix(matrix) {
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix.length; j++) {
                if (matrix[i][j][1] > 0) {
                    this.addEdge(new Edge(this.nodes[i], this.nodes[j], matrix[i][j][0], matrix[i][j][1]));
                }
            }
        }
    }

    clearEdges() {
        this.edges = [];
    }

    draw() {
        for (let edge of this.edges) {
            edge.draw();
        }
        for (let node of this.nodes) {
            node.draw();
        }
    }
}

function readData() {
    const data = JSON.parse(document.getElementById('impact-map-data').textContent);
    return data;
}

function absoluteToRelative(x, y) {
    return {
        x: (x - rect.left - canvas.width / 2 - VIEWSTATES.VIEWPORT_ORIGIN.x * VIEWSTATES.SCALE) / VIEWSTATES.SCALE,
        y: (y - rect.top - canvas.height / 2 - VIEWSTATES.VIEWPORT_ORIGIN.y * VIEWSTATES.SCALE) / VIEWSTATES.SCALE,
    }
}

function setupMouseEvents() {
    const zoomIncrement = 0.1;
    // Add zoom functionality, zoom based on mouse position
    canvas.addEventListener('wheel', function (e) {
        const delta = e.deltaY;
        if (delta > 0 && VIEWSTATES.SCALE > MIN_ZOOM) {
            VIEWSTATES.SCALE /= 1.1;
            mouse.updateMouse(e);
        } else if (delta < 0 && VIEWSTATES.SCALE < MAX_ZOOM) {
            VIEWSTATES.SCALE *= 1.1;
            mouse.updateMouse(e);
        }

        draw();
    });

    // Add drag functionality
    let isDragging = false;
    let lastX, lastY;
    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            VIEWSTATES.VIEWPORT_ORIGIN.x += e.movementX / VIEWSTATES.SCALE;
            VIEWSTATES.VIEWPORT_ORIGIN.y += e.movementY / VIEWSTATES.SCALE;


            draw();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Add touch events for mobile devices
    canvas.addEventListener('touchstart', (event) => {
        isDragging = true;
        lastX = event.touches[0].clientX;
        lastY = event.touches[0].clientY;
    });

    canvas.addEventListener('touchmove', (event) => {
        if (isDragging) {
            const touchX = event.touches[0].clientX;
            const touchY = event.touches[0].clientY;
            VIEWSTATES.VIEWPORT_ORIGIN.x += (touchX - lastX) / VIEWSTATES.SCALE;
            VIEWSTATES.VIEWPORT_ORIGIN.y += (touchY - lastY) / VIEWSTATES.SCALE;
            lastX = touchX;
            lastY = touchY;

            draw();
        }
    });
    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Add click event to show overlay
    canvas.addEventListener('click', (e) => {
        const pos = absoluteToRelative(e.clientX, e.clientY);
        for (let node of impactGraph.nodes) {
            if (Math.abs(node.x - pos.x) < node.diameter / 2 && Math.abs(node.y - pos.y) < node.diameter / 2) {
                const overlayContent = document.createElement('div');
                overlayContent.className = 'overlay-content';

                rawTotalChangeAverage = node.companyNodes.reduce((acc, curr) => acc + curr.totalChange, 0) / node.companyNodes.length;
                // only include pValues < 0.05 in the average
                meaningfulTotalChangeAverage = node.companyNodes.filter(companyNode => companyNode.pValue < 0.05).reduce((acc, curr) => acc + curr.totalChange, 0) / node.companyNodes.filter(companyNode => companyNode.pValue < 0.05).length;

                const rawTotalChangeAverageText = document.createElement('p');
                rawTotalChangeAverageText.innerHTML = `Raw Total Change Average: <span class="emphasis">${(rawTotalChangeAverage * 100).toFixed(2)}%</span>`;
                rawTotalChangeAverageText.className = 'overlay-stat';

                const meaningfulTotalChangeAverageText = document.createElement('p');
                if (!isNaN(meaningfulTotalChangeAverage)) {
                    meaningfulTotalChangeAverageText.innerHTML = `Meaningful Total Change Average (p < .05): <span class="emphasis">${(meaningfulTotalChangeAverage * 100).toFixed(2)}%</span>`;

                } else {
                    meaningfulTotalChangeAverageText.innerHTML = `Meaningful Total Change Average (p < .05): <span class="emphasis">N/A</span>`;
                }
                meaningfulTotalChangeAverageText.className = 'overlay-stat';


                // add companies and stats as table
                const table = document.createElement('table');
                table.className = 'overlay-table';
                const headerRow = document.createElement('tr');
                const header0 = document.createElement('th');
                header0.innerHTML = '#';

                const header1 = document.createElement('th');
                header1.innerHTML = 'Company';
                const header2 = document.createElement('th');
                header2.innerHTML = 'Ticker';
                const header3 = document.createElement('th');
                header3.innerHTML = 'Total Change';
                const header4 = document.createElement('th');
                header4.innerHTML = 'P-Value';

                headerRow.appendChild(header0);
                headerRow.appendChild(header1);
                headerRow.appendChild(header2);
                headerRow.appendChild(header3);
                headerRow.appendChild(header4);
                table.appendChild(headerRow);

                for (let companyNode of node.companyNodes) {
                    const row = document.createElement('tr');
                    const cell0 = document.createElement('td');
                    cell0.innerHTML = companyNode.id;

                    const cell1 = document.createElement('td');
                    cell1.innerHTML = companyNode.name;
                    const cell2 = document.createElement('td');
                    cell2.innerHTML = companyNode.ticker;
                    const cell3 = document.createElement('td');
                    cell3.innerHTML = companyNode.totalChange.toFixed(5);
                    const cell4 = document.createElement('td');
                    cell4.innerHTML = companyNode.pValue.toFixed(5);

                    row.appendChild(cell0);
                    row.appendChild(cell1);
                    row.appendChild(cell2);
                    row.appendChild(cell3);
                    row.appendChild(cell4);
                    table.appendChild(row);
                }


                // Store data to use in chart visualization
                const chartData = node.companyNodes.map(companyNode => {
                    return {
                        name: companyNode.name,
                        ticker: companyNode.ticker,
                        totalChange: companyNode.totalChange,
                        pValue: companyNode.pValue
                    };
                });
                // Create a chart using Chart.js
                const chartCanvas = document.createElement('canvas');
                chartCanvas.id = 'chartCanvas';
                // change canvas background colour to transparent white
                chartCanvas.style.backgroundColor = 'rgba(255, 255, 255, 0.0)';

                const chartCtx = chartCanvas.getContext('2d');
                const chartLabels = chartData.map(data => data.name);
                const chartValues = chartData.map(data => data.totalChange);
                const chartPValues = chartData.map(data => data.pValue);

                // bar chart with bubbles at the top of each bar
                const chart = new Chart(chartCtx, {
                    type: 'bar',
                    data: {
                        labels: chartLabels,
                        datasets: [
                            {
                                label: 'Total Change',
                                data: chartValues,
                                backgroundColor: chartValues.map(value =>
                                    value < 0 ? 'rgba(231, 76, 60, 0.8)' : 'rgba(46, 204, 113, 0.8)'
                                ),
                                borderColor: chartValues.map(value =>
                                    value < 0 ? 'rgba(192, 57, 43, 1)' : 'rgba(39, 174, 96, 1)'
                                ),
                                borderWidth: 1,
                            },
                            {
                                label: 'Inverse P-Value (radius)',
                                data: chartValues.map((v, index) => ({ x: index, y: v, r: Math.min(100, 2 / Math.sqrt(chartPValues[index])) })), // scale pValue to 100 for better visibility
                                type: 'bubble',
                                // tooltip
                                tooltip: {
                                    callbacks: {
                                        label: function (tooltipItem) {
                                            return `Total Change: ${(chartValues[tooltipItem.dataIndex] >= 0 ? "+" : '-') + (chartValues[tooltipItem.dataIndex] * 100).toFixed(5)}% P-Value: ${chartPValues[tooltipItem.dataIndex].toFixed(5)}`;
                                        }
                                    }
                                },
                                backgroundColor: 'rgba(77, 139, 238, 0.55)',
                                borderColor: 'rgb(47, 96, 232)',
                                borderWidth: 1,
                            }
                        ]
                    },
                    options: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',

                        responsive: true,
                        // maintainAspectRatio: false, // ✨ allows dynamic resizing
                        scales: {
                            y: {
                                beginAtZero: true,

                            },
                            x: {
                                // don;'t show labels on x axis
                                ticks: {
                                    display: false // Hide x-axis labels
                                },
                            }

                        }
                        , plugins: {
                            title: {
                                display: true,
                                text: 'Total Change by Company with P-Value',
                                color: 'black',
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                },
                                padding: {
                                    top: 10,
                                    bottom: 10
                                }
                            }
                        }
                    }
                });

                // using p values < 0.05 make another bar chart underneath the first one
                const chartCanvas2 = document.createElement('canvas');
                chartCanvas2.id = 'chartCanvas2';
                // change canvas background colour to transparent white
                chartCanvas2.style.backgroundColor = 'rgba(255, 255, 255, 0.0)';
                const chartCtx2 = chartCanvas2.getContext('2d');
                const chartLabels2 = chartData.filter(data => data.pValue < 0.05).map(data => data.name);
                const chartValues2 = chartData.filter(data => data.pValue < 0.05).map(data => data.totalChange);
                // bar chart

                const chart2 = new Chart(chartCtx2, {
                    type: 'bar',
                    data: {
                        labels: chartLabels2,
                        datasets: [
                            {
                                label: 'Total Change',
                                data: chartValues2,
                                backgroundColor: chartValues2.map(value =>
                                    value < 0 ? 'rgba(231, 76, 60, 0.8)' : 'rgba(46, 204, 113, 0.8)'
                                ),
                                borderColor: chartValues2.map(value =>
                                    value < 0 ? 'rgba(192, 57, 43, 1)' : 'rgba(39, 174, 96, 1)'
                                ),
                                borderWidth: 1,
                            }
                        ]
                    },
                    options: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',

                        responsive: true,
                        // maintainAspectRatio: false, // ✨ allows dynamic resizing
                        scales: {
                            y: {
                                beginAtZero: true,

                            },
                            x: {
                                ticks: {
                                    autoSkip: false, // Prevent skipping
                                    maxRotation: 75, // Rotate labels
                                    minRotation: 75

                                }
                            }

                        }
                        , plugins: {
                            title: {
                                display: true,
                                text: `Total Change with P-Value < 0.05 (${chartLabels2.length} total)`,
                                color: 'black',
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                },
                                padding: {
                                    top: 10,
                                    bottom: 10
                                }
                            }
                        }
                    }
                });

                // make third chart (radar chart) to show correlation with other events
                const chartCanvas3 = document.createElement('canvas');
                chartCanvas3.id = 'chartCanvas3';
                // change canvas background colour to transparent white
                chartCanvas3.style.backgroundColor = 'rgba(255, 255, 255, 0.0)';
                const chartCtx3 = chartCanvas3.getContext('2d');
                const threshold = 5;
                const fixedChangeTolerance = 5; // 5%
                const chartValues3 = impactGraph.nodes.map(n => {
                    const commonCompanies = n.companyNodes.filter(companyNode => {
                        return node.companyNodes.some(c => c.name === companyNode.name && Math.abs(companyNode.totalChange - c.totalChange) < fixedChangeTolerance / 100);
                    });
                    return commonCompanies.length;

                }).filter(value => value > threshold); // filter out values > 5
                chartLabels3 = impactGraph.nodes.map(node => node.name).filter((_, index) => chartValues3[index] > threshold); // filter out values > 5
                // radar chart
                const chart3 = new Chart(chartCtx3, {
                    type: 'radar',
                    data: {
                        labels: chartLabels3,
                        datasets: [
                            {
                                label: `Events with ${threshold} Common Companies with < 5% total change similarity`,
                                tooltip: {
                                    callbacks: {
                                        label: function (tooltipItem) {
                                            return `Common Companies: ${tooltipItem.dataIndex}`;
                                        }
                                    }
                                },
                                data: chartValues3,
                                backgroundColor: 'rgba(77, 139, 238, 0.55)',
                                borderColor: 'rgb(47, 96, 232)',
                                borderWidth: 1,
                            }
                        ]
                    },
                    options: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',

                        responsive: true,
                        // maintainAspectRatio: false, // ✨ allows dynamic resizing
                        scales: {
                            r: {
                                beginAtZero: true,

                            }
                        }
                        , plugins: {
                            title: {
                                display: true,
                                text: `Similar Events`,
                                color: 'black',
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                },
                                padding: {
                                    top: 10,
                                    bottom: 10
                                }
                            }
                        }
                    }
                });
                // add chartCanvas3 to infoContainer


                // create infoContainer div to hold info
                const infoContainer = document.createElement('div');
                infoContainer.className = 'info-container';

                // add close button
                const closeButton = document.createElement('button');
                closeButton.innerHTML = 'Close';
                closeButton.className = 'close-btn';
                closeButton.onclick = function () {
                    hideOverlay();
                }
                infoContainer.appendChild(closeButton);

                // add event name
                const eventName = document.createElement('h2');
                eventName.innerHTML = node.name;
                eventName.className = 'overlay-event-name';
                infoContainer.appendChild(eventName);
                overlayContent.appendChild(infoContainer);

                // add raw and meaningful total change average
                infoContainer.appendChild(rawTotalChangeAverageText);
                infoContainer.appendChild(meaningfulTotalChangeAverageText);

                // add charts and table to infoContainer

                infoContainer.appendChild(chartCanvas);
                if (chartLabels2.length > 0) {
                    infoContainer.appendChild(chartCanvas2);
                }
                infoContainer.appendChild(chartCanvas3);

                infoContainer.appendChild(table);








                // make overlayContent scrollable
                overlayContent.style.overflowY = 'scroll';
                overlayContent.style.maxHeight = '80vh';
                showOverlay(overlayContent);

                break;
            }
        }
    });



}

function calculateAdjacencyMatrix() {
    const adjacencyMatrix = Array(impactGraph.nodes.length).fill().map(() => Array(impactGraph.nodes.length).fill(0));

    for (let i = 0; i < impactGraph.nodes.length; i++) {
        event1Companies = impactGraph.nodes[i].companyNodes;
        for (let j = 0; j < impactGraph.nodes.length; j++) {
            if (i === j) {
                continue;
            }
            event2Companies = impactGraph.nodes[j].companyNodes;
            let commonCompanies = [];
            for (let company1 of event1Companies) {
                for (let company2 of event2Companies) {
                    if (company1.name === company2.name && Math.abs(company1.totalChange - company2.totalChange) < changePercentSliderValue / 100) {
                        commonCompanies.push(company1);
                    }
                }
            }

            if (commonCompanies.length > commonSliderValue) {
                adjacencyMatrix[i][j] = [commonCompanies.map((c) => c.name).join(', '), Math.min(5, commonCompanies.length)];
            }
        }

    }

    return adjacencyMatrix;
}

function showOverlay(overlayContent) {
    const overlay = document.getElementById('myOverlay');
    overlay.innerHTML = ''; // Clear previous content
    overlay.appendChild(overlayContent);
    overlay.style.display = 'flex';
}

function hideOverlay() {
    document.getElementById('myOverlay').style.display = 'none';
}


function setup() {
    canvas = document.getElementById('impact-map');
    // set dimensions to 100% of parent
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    ctx = canvas.getContext('2d');
    rect = canvas.getBoundingClientRect();
    // set the origin to the center of the canvas
    ctx.translate(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2));
    ctx.moveTo(0, 0);
    VIEWSTATES.VIEWPORT_ORIGIN.x = -canvas.width / 2;
    VIEWSTATES.VIEWPORT_ORIGIN.y = -canvas.height / 2;


    setupMouseEvents();

    impactData = readData();

    /**
     * impactData has the following structure:
     * {
     *   "EVENT NAME": {"COMPANY NAME": [{
                            "total_change": -0.08115582939913964,
                            "p_value": 0.009265537746787518,
                            "pre_mean": 0.005126153891402141,
                            "post_mean": -0.013957405619525779,
                            "publish_date": "16/04/2024",
                            "ticker": "MMM"
                        }, ...],},
     *   ...
     *  
     *
     * }
     *         
     */

    impactGraph = new ImpactGraph();

    const usedCoordinates = [];
    let eventIndex = 0;
    for (const eventName in impactData) {
        const companyNames = [];

        for (const companyName in impactData[eventName]) {
            companyNames.push(companyName);
        }
        // Generate random coordinates
        let x, y;
        let maxWhile = 1000;
        do {
            // have the x and y randomly genrated within circle of radius 10000
            const r = Math.random() * 5000;
            const theta = Math.random() * 2 * Math.PI;
            x = r * Math.cos(theta);
            y = r * Math.sin(theta);

            maxWhile--;
            if (maxWhile === 0) {
                break;
            }
        }
        while (usedCoordinates.some(coord => Math.abs(coord[0] - x) < 300 && Math.abs(coord[1] - y) < 300));


        usedCoordinates.push([x, y]);
        eventNode = new EventNode(eventIndex, eventName, x, y, companyNames.length + 20);


        // add company nodes
        const companyNodes = [];
        let companyIndex = 0;
        for (const companyName of companyNames) {
            companyTicker = impactData[eventName][companyName][0].ticker;
            companyTotalChange = impactData[eventName][companyName].reduce((acc, curr) => acc + curr.total_change, 0) / impactData[eventName][companyName].length;
            companyPValue = impactData[eventName][companyName].reduce((acc, curr) => acc + curr.p_value, 0) / impactData[eventName][companyName].length;
            const companyNode = new CompanyNode(companyIndex, companyName, x + 100, y + 100 + companyIndex * 50, 25, 20, companyTicker, companyTotalChange, companyPValue);
            companyNodes.push(companyNode);
            companyIndex++;
        }

        eventNode.addCompanyNodes(companyNodes);
        impactGraph.addNode(eventNode);

        eventIndex++;
    }

    adjacencyMatrix = calculateAdjacencyMatrix();
    impactGraph.addEdgesByAdjacencyMatrix(adjacencyMatrix);



    // SLIDER
    const slider1 = document.getElementById("slider1");
    const tooltip1 = document.getElementById("tooltip1");

    function updateCommonSliderValue() {
        commonSliderValue = slider1.value;
        tooltip1.textContent = `Common Companies: ${commonSliderValue}`;

        // Calculate position
        const percent = (commonSliderValue - slider1.min) / (slider1.max - slider1.min);
        const offset = percent * (slider1.clientWidth - 20);
        tooltip1.style.left = `${offset}px`;

        adjacencyMatrix = calculateAdjacencyMatrix();
        impactGraph.clearEdges();
        impactGraph.addEdgesByAdjacencyMatrix(adjacencyMatrix);
        draw();
    }

    function updateChangePercentSliderValue() {
        changePercentSliderValue = slider2.value;
        tooltip2.textContent = `Change Tolerance (%): ${changePercentSliderValue}`;

        // Calculate position
        const percent = (changePercentSliderValue - slider2.min) / (slider2.max - slider2.min);
        const offset = percent * (slider2.clientWidth - 20);
        tooltip2.style.left = `${offset}px`;

        adjacencyMatrix = calculateAdjacencyMatrix();
        impactGraph.clearEdges();
        impactGraph.addEdgesByAdjacencyMatrix(adjacencyMatrix);
        draw();
    }

    slider1.addEventListener("input", updateCommonSliderValue);
    slider2.addEventListener("input", updateChangePercentSliderValue);
    updateCommonSliderValue();
    updateChangePercentSliderValue();
}

function draw() {
    // make background dark
    ctx.fillStyle = '#282828';
    ctx.fillRect(-canvas.width * 100, -canvas.height * 100, canvas.width * 2 * 100, canvas.height * 2 * 100);
    ctx.save();
    ctx.scale(VIEWSTATES.SCALE, VIEWSTATES.SCALE);
    ctx.translate(VIEWSTATES.VIEWPORT_ORIGIN.x, VIEWSTATES.VIEWPORT_ORIGIN.y);

    // ctx.translate(canvas.width / 2, canvas.height / 2);
    impactGraph.draw();
    ctx.restore();
}

setup();
draw();

