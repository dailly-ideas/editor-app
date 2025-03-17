import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

// Extend Fabric.Canvas type to include undo/redo functionality
declare module 'fabric' {
    namespace fabric {
        interface Canvas {
            enableHistory(): void;
            undo(): void;
            redo(): void;
        }
    }
}

interface CanvasProps {
    backgroundImage: string;
    width: number;
    height: number;
}

interface HistoryState {
    objects: fabric.Object[];
    timestamp: number;
}

const Canvas = ({ backgroundImage, width, height }: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const saveState = () => {
        if (canvas) {
            const newState: HistoryState = {
                objects: canvas.getObjects().map(obj => fabric.util.object.clone(obj)),
                timestamp: Date.now()
            };

            // Remove any states after the current index (for new actions after undo)
            const newHistory = history.slice(0, historyIndex + 1);
            setHistory([...newHistory, newState]);
            setHistoryIndex(newHistory.length);
        }
    };

    const loadState = (state: HistoryState) => {
        if (canvas) {
            // Clear current objects
            canvas.getObjects().forEach(obj => canvas.remove(obj));

            // Add objects from the state
            state.objects.forEach(obj => {
                canvas.add(fabric.util.object.clone(obj));
            });

            canvas.renderAll();
        }
    };

    useEffect(() => {
        if (canvasRef.current) {
            const fabricCanvas = new fabric.Canvas(canvasRef.current, {
                width,
                height,
                backgroundColor: 'transparent',
            });

            // Load background image
            fabric.Image.fromURL(backgroundImage, (img) => {
                img.scaleToWidth(width);
                img.scaleToHeight(height);
                fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
                    scaleX: fabricCanvas.width! / img.width!,
                    scaleY: fabricCanvas.height! / img.height!,
                });

                // Save initial state after background image is loaded
                setCanvas(fabricCanvas);
                saveState();
            });

            // Cleanup
            return () => {
                fabricCanvas.dispose();
            };
        }
    }, [backgroundImage, width, height]);

    useEffect(() => {
        if (canvas) {
            const handleModification = () => {
                saveState();
            };

            // Log and save state on object modifications
            canvas.on('object:modified', (e) => {
                const obj = e.target;
                if (obj) {
                    const bounds = obj.getBoundingRect();
                    console.log('Object modified:', {
                        x: bounds.left,
                        y: bounds.top,
                        width: bounds.width,
                        height: bounds.height,
                    });
                    handleModification();
                }
            });

            // Log and save state on new objects
            canvas.on('object:added', (e) => {
                const obj = e.target;
                if (obj) {
                    const bounds = obj.getBoundingRect();
                    console.log('Object added:', {
                        x: bounds.left,
                        y: bounds.top,
                        width: bounds.width,
                        height: bounds.height,
                    });
                    handleModification();
                }
            });

            // Save state when objects are removed
            canvas.on('object:removed', handleModification);

            return () => {
                canvas.off('object:modified');
                canvas.off('object:added');
                canvas.off('object:removed');
            };
        }
    }, [canvas, history, historyIndex]);

    const addRectangle = () => {
        if (canvas) {
            const rect = new fabric.Rect({
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                fill: 'transparent',
                stroke: 'black',
                strokeWidth: 2,
            });
            canvas.add(rect);
            canvas.setActiveObject(rect);
            canvas.renderAll();
        }
    };

    const addCircle = () => {
        if (canvas) {
            const circle = new fabric.Circle({
                left: 100,
                top: 100,
                radius: 50,
                fill: 'transparent',
                stroke: 'black',
                strokeWidth: 2,
            });
            canvas.add(circle);
            canvas.setActiveObject(circle);
            canvas.renderAll();
        }
    };

    const deleteSelected = () => {
        if (canvas) {
            const activeObject = canvas.getActiveObject();
            if (activeObject) {
                canvas.remove(activeObject);
                canvas.renderAll();
            }
        }
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            loadState(history[newIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            loadState(history[newIndex]);
        }
    };

    const exportCanvas = () => {
        if (canvas) {
            const dataURL = canvas.toDataURL({
                format: 'png',
                quality: 1,
            });
            const link = document.createElement('a');
            link.download = 'canvas-export.png';
            link.href = dataURL;
            link.click();
        }
    };

    return (
        <div className="canvas-container">
            <div className="toolbar">
                <button onClick={addRectangle}>Add Rectangle</button>
                <button onClick={addCircle}>Add Circle</button>
                <button onClick={deleteSelected}>Delete Selected</button>
                <button onClick={undo} disabled={historyIndex <= 0}>Undo</button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1}>Redo</button>
                <button onClick={exportCanvas}>Export</button>
            </div>
            <canvas ref={canvasRef} />
        </div>
    );
};

export default Canvas; 