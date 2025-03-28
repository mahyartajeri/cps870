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

