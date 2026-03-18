export function addRedCircleOverlay(overlay) {
        const canvas = overlay;
        const ctx = canvas.getContext("2d");

        const x = canvas.width / 2;
        const y = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
    }

export function brushSizeOverlay(overlay, size = 5) {
    const canvas = overlay;
    const ctx = canvas.getContext("2d");
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.lineWidth = 5; 
    ctx.strokeStyle = "red"; 
    ctx.stroke(); 
}

export function clearOverlay(overlay) {
        const canvas = overlay;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }