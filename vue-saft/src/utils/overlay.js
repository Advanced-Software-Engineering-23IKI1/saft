export function addRedCircleOverlay(overlay) {
        const canvas = overlayRef.value;
        const ctx = canvas.getContext("2d");

        const x = canvas.width / 2;
        const y = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
    }



export function clearOverlay(overlay) {
        const canvas = overlayRef.value;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }