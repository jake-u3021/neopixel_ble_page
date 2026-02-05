const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const CONFIG = {
    size: 320,
    outerRadius: 160,
    innerRadius: 110,     // make this 0 for solid disk
    saturation: 100,
    lightness: 50,
    step: 1               // angle resolution
};

let currentHue = 0;

// Draw wheel
function drawWheel() {
    ctx.clearRect(0, 0, CONFIG.size, CONFIG.size);

    for (let a = 0; a < 360; a += CONFIG.step) {
        const start = (a - CONFIG.step) * Math.PI / 180;
        const end = a * Math.PI / 180;

        ctx.beginPath();
        ctx.arc(160, 160, CONFIG.outerRadius, start, end);
        ctx.arc(160, 160, CONFIG.innerRadius, end, start, true);
        ctx.closePath();

        ctx.fillStyle = `hsl(${a}, ${CONFIG.saturation}%, ${CONFIG.lightness}%)`;
        ctx.fill();
    }
}

// Draw cursor
function drawCursor(hue) {
    const angle = hue * Math.PI / 180;
    const r = (CONFIG.outerRadius + CONFIG.innerRadius) / 2;

    const x = 160 + r * Math.cos(angle);
    const y = 160 - r * Math.sin(angle);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
}

// Convert mouse → hue
function getHueFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 160;
    const y = 160 - (e.clientY - rect.top);

    const d = Math.sqrt(x*x + y*y);
    if (d < CONFIG.innerRadius || d > CONFIG.outerRadius) return null;

    let angle = Math.atan2(y, x) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
}

// Redraw everything
function render() {
    drawWheel();
    drawCursor(currentHue);
}

// Interaction
let dragging = false;

canvas.addEventListener("mousedown", e => {
    dragging = true;
    const h = getHueFromEvent(e);
    if (h !== null) currentHue = h;
    render();
});

canvas.addEventListener("mousemove", e => {
    if (!dragging) return;
    const h = getHueFromEvent(e);
    if (h !== null) currentHue = h;
    render();
});

canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const t = e.touches[0];
    const h = getHueFromEvent(t);
    if (h !== null) {
        currentHue = h;
        render();
    }
}, { passive: false });

window.addEventListener("mouseup", () => dragging = false);

// Init
render();