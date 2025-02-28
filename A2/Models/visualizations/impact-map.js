let canvas, ctx, rect, impactGraph;
const VIEWSTATES = {
    SCALE: 1,
    VIEWPORT_ORIGIN: {
        x: 0,
        y: 0,
    },
}
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 2;

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
        if (color === '') {
            this.color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
        } else {
            this.color = color;
        }
    }

    draw() {
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
        ctx.fillStyle = 'beige';
        ctx.font = '52pt Arial';
        ctx.textAlign = 'center';
        if (this.diameter > 120) {
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

class Edge {
    /**
     * 
     * @param {EventNode} from 
     * @param {EventNode} to 
     * @param {Number} weight
     */
    constructor(from, to, weight) {
        this.from = from;
        this.to = to;
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
                if (matrix[i][j] > 0) {
                    this.addEdge(new Edge(this.nodes[i], this.nodes[j], matrix[i][j]));
                }
            }
        }
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
     *   "EVENT NAME": {"COMPANY NAME": [-0.16949999999999932, 3.0600100000000054]},
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
        let maxWhile = 100;
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
        while (usedCoordinates.some(coord => Math.abs(coord[0] - x) < 250 && Math.abs(coord[1] - y) < 250));


        usedCoordinates.push([x, y]);
        eventNode = new EventNode(eventIndex, eventName, x, y, companyNames.length * 10 + 10);
        impactGraph.addNode(eventNode);
        eventIndex++;
    }

    const adjacencyMatrix = Array(impactGraph.nodes.length).fill().map(() => Array(impactGraph.nodes.length).fill(0));


    for (let i = 0; i < impactGraph.nodes.length; i++) {
        for (let j = 0; j < impactGraph.nodes.length; j++) {
            if (i !== j) {
                const event1 = impactGraph.nodes[i];
                const event2 = impactGraph.nodes[j];
                const event1Companies = Object.keys(impactData[event1.name]);
                const event2Companies = Object.keys(impactData[event2.name]);

                const commonCompanies = event1Companies.filter(company => event2Companies.includes(company));
                if (commonCompanies.length < 1) { // the magic number lol
                    continue;
                }
                // affected 10 companies within a threshold
                similarCompanies = 0;
                for (const company of commonCompanies) {
                    const impact1 = impactData[event1.name][company];
                    const impact2 = impactData[event2.name][company];

                    const avgImpact1 = impact1.reduce((a, b) => a + b, 0) / impact1.length;
                    const avgImpact2 = impact2.reduce((a, b) => a + b, 0) / impact2.length;
                    if (Math.abs(avgImpact1 - avgImpact2) < 0.5) {
                        similarCompanies++;
                    }
                }

                if (similarCompanies > 3) {
                    adjacencyMatrix[i][j] = similarCompanies;
                }




            }
        }
    }

    impactGraph.addEdgesByAdjacencyMatrix(adjacencyMatrix);
    console.log(adjacencyMatrix);

}

function draw() {
    // make background dark
    ctx.fillStyle = '#282828';
    ctx.fillRect(-canvas.width * 10, -canvas.height * 10, canvas.width * 2 * 10, canvas.height * 2 * 10);
    ctx.save();
    ctx.scale(VIEWSTATES.SCALE, VIEWSTATES.SCALE);
    ctx.translate(VIEWSTATES.VIEWPORT_ORIGIN.x, VIEWSTATES.VIEWPORT_ORIGIN.y);

    // ctx.translate(canvas.width / 2, canvas.height / 2);
    impactGraph.draw();
    ctx.restore();
}

setup();
draw();

