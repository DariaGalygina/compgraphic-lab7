// Класс точки в 3D пространстве
class Point3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    toArray() {
        return [this.x, this.y, this.z];
    }
    
    // Создание копии точки
    clone() {
        return new Point3D(this.x, this.y, this.z);
    }
}

// Класс грани (многоугольника)
class Face {
    constructor(vertexIndices) {
        this.vertexIndices = vertexIndices;
    }
}

// Класс многогранника
class Polyhedron {
    constructor(vertices, faces) {
        this.vertices = vertices.map(v => new Point3D(...v));
        this.faces = faces.map(f => new Face(f));
        this.center = this.calculateCenter();
    }
    
    // Вычисление центра многогранника
    calculateCenter() {
        const sum = this.vertices.reduce((acc, vertex) => {
            return new Point3D(
                acc.x + vertex.x,
                acc.y + vertex.y, 
                acc.z + vertex.z
            );
        }, new Point3D(0, 0, 0));
        
        const count = this.vertices.length;
        return new Point3D(sum.x / count, sum.y / count, sum.z / count);
    }
    
    // Создание копии многогранника
    clone() {
        const vertices = this.vertices.map(v => v.toArray());
        const faces = this.faces.map(f => [...f.vertexIndices]);
        return new Polyhedron(vertices, faces);
    }
    
    // Экспорт в формат OBJ
    toOBJ() {
        let objContent = "# Экспортированная 3D модель\n";
        
        // Вершины
        this.vertices.forEach(vertex => {
            objContent += `v ${vertex.x} ${vertex.y} ${vertex.z}\n`;
        });
        
        // Грани
        objContent += "\n";
        this.faces.forEach(face => {
            const faceIndices = face.vertexIndices.map(idx => idx + 1).join(' ');
            objContent += `f ${faceIndices}\n`;
        });
        
        return objContent;
    }
}

// Класс для работы с матрицами преобразований
class TransformationMatrix {
    static getIdentityMatrix() {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }
    
    static multiplyMatrices(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < a[0].length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }
    
    static multiplyMatrixVector(m, v) {
        return [
            m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2] + m[0][3],
            m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2] + m[1][3],
            m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2] + m[2][3],
            m[3][0]*v[0] + m[3][1]*v[1] + m[3][2]*v[2] + m[3][3]
        ];
    }
    
    static getRotationXMatrix(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [1, 0, 0, 0],
            [0, c, -s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1]
        ];
    }
    
    static getRotationYMatrix(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s, 0, c, 0],
            [0, 0, 0, 1]
        ];
    }
    
    static getRotationZMatrix(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }
    
    static getScaleMatrix(scale) {
        return [
            [scale, 0, 0, 0],
            [0, scale, 0, 0],
            [0, 0, scale, 0],
            [0, 0, 0, 1]
        ];
    }
    
    static getTranslationMatrix(dx, dy, dz) {
        return [
            [1, 0, 0, dx],
            [0, 1, 0, dy],
            [0, 0, 1, dz],
            [0, 0, 0, 1]
        ];
    }
    
    static getReflectionMatrix(reflectXY, reflectXZ, reflectYZ) {
        let matrix = this.getIdentityMatrix();
        // Отражение относительно XY (меняем знак Z)
        if (reflectXY) matrix[2][2] = -1;
        // Отражение относительно XZ (меняем знак Y)
        if (reflectXZ) matrix[1][1] = -1;
        // Отражение относительно YZ (меняем знак X)
        if (reflectYZ) matrix[0][0] = -1;
        return matrix;
    }
    
    // Масштабирование относительно центра
    static getScaleAroundCenterMatrix(scale, center) {
        const toOrigin = this.getTranslationMatrix(-center.x, -center.y, -center.z);
        const scaling = this.getScaleMatrix(scale);
        const backFromOrigin = this.getTranslationMatrix(center.x, center.y, center.z);
        
        let matrix = this.multiplyMatrices(toOrigin, scaling);
        return this.multiplyMatrices(matrix, backFromOrigin);
    }
}

// Класс для работы с OBJ файлами
class OBJLoader {
    static parseOBJ(content) {
        const vertices = [];
        const faces = [];
        
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('v ')) {
                // Вершина
                const parts = trimmed.split(/\s+/).slice(1);
                if (parts.length >= 3) {
                    const x = parseFloat(parts[0]);
                    const y = parseFloat(parts[1]);
                    const z = parseFloat(parts[2]);
                    vertices.push([x, y, z]);
                }
            } else if (trimmed.startsWith('f ')) {
                // Грань
                const parts = trimmed.split(/\s+/).slice(1);
                const faceIndices = [];
                
                for (const part of parts) {
                    // OBJ формат может быть: f v1 v2 v3 или f v1/vt1 v2/vt2 v3/vt3
                    const vertexIndex = parseInt(part.split('/')[0]);
                    if (!isNaN(vertexIndex)) {
                        // OBJ индексы начинаются с 1, наши с 0
                        faceIndices.push(vertexIndex - 1);
                    }
                }
                
                if (faceIndices.length >= 3) {
                    faces.push(faceIndices);
                }
            }
        }
        
        return new Polyhedron(vertices, faces);
    }
}

// Класс для создания фигур вращения
class RotationFigureBuilder {
    // Параметры - Образующая (массив точек), ось вращения, количество разбиений (секторов)
    static createRotationFigure(profilePoints, axis, slices) {
        const vertices = [];
        const faces = [];
        
        // Угол вращений
        const angleStep = (2 * Math.PI) / slices;
        
        // Создаем вершины
        for (let i = 0; i <= slices; i++) {
            const angle = i * angleStep;
            
            for (const point of profilePoints) {
                let x, y, z;
                
                // Каждая точка образующей вращается вокруг выбранной оси с шагом angleStep
                switch (axis) {
                    case 'x':
                        // Вращение вокруг оси X
                        x = point[0];
                        y = point[1] * Math.cos(angle) - point[2] * Math.sin(angle);
                        z = point[1] * Math.sin(angle) + point[2] * Math.cos(angle);
                        break;
                    case 'y':
                        // Вращение вокруг оси Y
                        x = point[0] * Math.cos(angle) + point[2] * Math.sin(angle);
                        y = point[1];
                        z = -point[0] * Math.sin(angle) + point[2] * Math.cos(angle);
                        break;
                    case 'z':
                        // Вращение вокруг оси Z
                        x = point[0] * Math.cos(angle) - point[1] * Math.sin(angle);
                        y = point[0] * Math.sin(angle) + point[1] * Math.cos(angle);
                        z = point[2];
                        break;
                }
                
                vertices.push([x, y, z]);
            }
        }
        
        // Создаем грани
        const pointsPerSlice = profilePoints.length;
        
        for (let i = 0; i < slices; i++) {
            for (let j = 0; j < pointsPerSlice - 1; j++) {
                const currentSlice = i * pointsPerSlice;
                const nextSlice = ((i + 1) % (slices + 1)) * pointsPerSlice;
                
                const v1 = currentSlice + j;        // (точка 0 текущего сектора)
                const v2 = currentSlice + j + 1;    // (точка 1 текущего сектора) 
                const v3 = nextSlice + j + 1;       // (точка 1 следующего сектора)
                const v4 = nextSlice + j;           // (точка 0 следующего сектора)
                
                // Два треугольника для квадрата
                faces.push([v1, v2, v3]);
                faces.push([v1, v3, v4]);
            }
        }
        
        return new Polyhedron(vertices, faces);
    }
}

// Класс для создания поверхностей
class SurfaceBuilder {
    // funcType - тип поверхности; xMin, xMax, yMin, yMax - область определения; gridSize - детализация сетки
    static createSurface(funcType, xMin, xMax, yMin, yMax, gridSize) {
        const vertices = [];
        const faces = [];
        
        const xStep = (xMax - xMin) / gridSize;
        const yStep = (yMax - yMin) / gridSize;
        
        // Создаем вершины
        for (let i = 0; i <= gridSize; i++) {
            for (let j = 0; j <= gridSize; j++) {
                const x = xMin + i * xStep;
                const y = yMin + j * yStep;
                const z = this.calculateFunction(funcType, x, y);
                
                vertices.push([x, y, z]);
            }
        }
        
        // Создаем грани
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const v1 = i * (gridSize + 1) + j;
                const v2 = i * (gridSize + 1) + j + 1;
                const v3 = (i + 1) * (gridSize + 1) + j + 1;
                const v4 = (i + 1) * (gridSize + 1) + j;
                
                // Два треугольника для квадрата
                faces.push([v1, v2, v3]);
                faces.push([v1, v3, v4]);
            }
        }
        
        return new Polyhedron(vertices, faces);
    }
    
    static calculateFunction(funcType, x, y) {
        switch (funcType) {
            case 'paraboloid':
                return x * x + y * y;
            case 'hyperbolic':
                return x * x - y * y;
            case 'sinc':
                const r = Math.sqrt(x * x + y * y);
                return r === 0 ? 1 : Math.sin(r) / r;
            case 'wave':
                return Math.sin(x) * Math.cos(y);
            case 'sphere':
                const r2 = x * x + y * y;
                return r2 <= 1 ? Math.sqrt(1 - r2) : 0;
            default:
                return 0;
        }
    }
}

// Класс визуализатора многогранников
class PolyhedronViewer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.initFigures();
        this.setupEventListeners();
        this.currentProjection = 'perspective';
        
        this.transformParams = {
            rotateX: 0, rotateY: 0, rotateZ: 0,
            scale: 1,
            translateX: 0, translateY: 0, translateZ: 0,
            reflectXY: false, reflectXZ: false, reflectYZ: false
        };
        
        this.currentFigure = this.figures[2];
        this.loadedFigure = null;
        this.draw();
    }
    
    initFigures() {
        this.figures = {
            1: this.createTetrahedron(),
            2: this.createCube(),
            3: this.createOctahedron(),
            4: this.createIcosahedron(),
            5: this.createDodecahedron()
        };
    }
    
    createTetrahedron() {
        const vertices = [
            [0, 0, Math.sqrt(8/3)], 
            [Math.sqrt(8/3), 0, -Math.sqrt(8/9)],
            [-Math.sqrt(2/3), Math.sqrt(2), -Math.sqrt(8/9)],
            [-Math.sqrt(2/3), -Math.sqrt(2), -Math.sqrt(8/9)]
        ];
        const faces = [
            [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]
        ];
        return new Polyhedron(vertices, faces);
    }
    
    createCube() {
        const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];
        const faces = [
            [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
            [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
        ];
        return new Polyhedron(vertices, faces);
    }
    
    createOctahedron() {
        const vertices = [
            [0, 0, 1], [1, 0, 0], [0, 1, 0], 
            [-1, 0, 0], [0, -1, 0], [0, 0, -1]
        ];
        const faces = [
            [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
            [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1]
        ];
        return new Polyhedron(vertices, faces);
    }
    
    createIcosahedron() {
        const t = (1 + Math.sqrt(5)) / 2;
        const vertices = [
            [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
            [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
            [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
        ];
        const faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];
        return new Polyhedron(vertices, faces);
    }
    
    createDodecahedron() {
        const phi = (1 + Math.sqrt(5)) / 2;
        const invPhi = 1 / phi;

        const vertices = [
            [ 1,  1,  1], [ 1,  1, -1], [ 1, -1,  1], [ 1, -1, -1],
            [-1,  1,  1], [-1,  1, -1], [-1, -1,  1], [-1, -1, -1],
            [ 0,  invPhi,  phi], [ 0, -invPhi,  phi], [ 0,  invPhi, -phi], [ 0, -invPhi, -phi],
            [ invPhi,  phi, 0], [-invPhi,  phi, 0], [ invPhi, -phi, 0], [-invPhi, -phi, 0],
            [ phi, 0,  invPhi], [-phi, 0,  invPhi], [ phi, 0, -invPhi], [-phi, 0, -invPhi]
        ];

        const faces = [
            [0, 8, 9, 2, 16],
            [0, 16, 17, 4, 12],
            [0, 12, 13, 1, 8],
            [1, 13, 14, 3, 10],
            [1, 10, 11, 5, 9],
            [2, 9, 5, 15, 18],
            [2, 18, 19, 6, 16],
            [3, 14, 13, 12, 17],
            [3, 17, 16, 6, 19],
            [4, 8, 1, 10, 11],
            [4, 11, 7, 15, 12],
            [5, 11, 10, 3, 14]
        ];

        return new Polyhedron(vertices, faces);
    }

    setupEventListeners() {
        // Вкладки
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Загрузка OBJ
        document.getElementById('loadObjButton').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.loadOBJFile(e.target.files[0]);
        });

        // Сохранение OBJ
        document.getElementById('saveObjButton').addEventListener('click', () => {
            this.saveOBJFile(this.currentFigure);
        });

        // Выбор фигуры
        document.getElementById('figure-select').addEventListener('change', (e) => {
            if (e.target.value === 'loaded') {
                this.currentFigure = this.loadedFigure || this.figures[2];
            } else {
                this.currentFigure = this.figures[e.target.value];
            }
            this.draw();
        });

        // Фигуры вращения
        document.getElementById('createRotationButton').addEventListener('click', () => {
            this.createRotationFigure();
        });

        document.getElementById('saveRotationButton').addEventListener('click', () => {
            if (this.rotationFigure) {
                this.saveOBJFile(this.rotationFigure);
            }
        });

        document.getElementById('slices').addEventListener('input', (e) => {
            document.getElementById('slicesValue').textContent = e.target.value;
        });

        // Поверхности
        document.getElementById('createSurfaceButton').addEventListener('click', () => {
            this.createSurface();
        });

        document.getElementById('saveSurfaceButton').addEventListener('click', () => {
            if (this.surfaceFigure) {
                this.saveOBJFile(this.surfaceFigure);
            }
        });

        document.getElementById('gridSize').addEventListener('input', (e) => {
            document.getElementById('gridSizeValue').textContent = e.target.value;
        });

        // Общие элементы управления
        document.getElementById('perspectiveButton').addEventListener('click', () => {
            this.currentProjection = 'perspective';
            this.updateActiveButton('perspectiveButton');
            this.draw();
        });
        
        document.getElementById('axonometricButton').addEventListener('click', () => {
            this.currentProjection = 'axonometric';
            this.updateActiveButton('axonometricButton');
            this.draw();
        });
        
        ['rotateX', 'rotateY', 'rotateZ'].forEach(axis => {
            document.getElementById(axis).addEventListener('input', (e) => {
                this.transformParams[axis] = parseFloat(e.target.value) * Math.PI / 180;
                document.getElementById(`${axis}Value`).textContent = `${e.target.value}°`;
                this.draw();
            });
        });
        
        document.getElementById('scale').addEventListener('input', (e) => {
            this.transformParams.scale = parseFloat(e.target.value);
            document.getElementById('scaleValue').textContent = e.target.value;
            this.draw();
        });
        
        ['translateX', 'translateY', 'translateZ'].forEach(axis => {
            document.getElementById(axis).addEventListener('input', (e) => {
                this.transformParams[axis] = parseFloat(e.target.value);
                document.getElementById(`${axis}Value`).textContent = e.target.value;
                this.draw();
            });
        });
        
        ['reflectXY', 'reflectXZ', 'reflectYZ'].forEach(plane => {
            document.getElementById(plane).addEventListener('change', (e) => {
                this.transformParams[plane] = e.target.checked;
                this.draw();
            });
        });
    }

    switchTab(tabName) {
        // Скрыть все вкладки
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Показать выбранную вкладку
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    loadOBJFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.loadedFigure = OBJLoader.parseOBJ(e.target.result);
                this.currentFigure = this.loadedFigure;
                document.getElementById('figure-select').value = 'loaded';
                this.draw();
                alert('Модель успешно загружена!');
            } catch (error) {
                alert('Ошибка при загрузке файла: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    saveOBJFile(figure) {
        if (!figure) {
            alert('Нет модели для сохранения!');
            return;
        }

        const objContent = figure.toOBJ();
        const blob = new Blob([objContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'model.obj';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    createRotationFigure() {
        try {
            const profileText = document.getElementById('profilePoints').value;
            const axis = document.getElementById('rotationAxis').value;
            const slices = parseInt(document.getElementById('slices').value);
            
            const profilePoints = [];
            const lines = profileText.split('\n');
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed) {
                    const coords = trimmed.split(',').map(coord => parseFloat(coord.trim()));
                    if (coords.length === 3 && coords.every(coord => !isNaN(coord))) {
                        profilePoints.push(coords);
                    }
                }
            }
            
            if (profilePoints.length < 2) {
                alert('Необходимо указать как минимум 2 точки образующей!');
                return;
            }
            
            this.rotationFigure = RotationFigureBuilder.createRotationFigure(profilePoints, axis, slices);
            this.currentFigure = this.rotationFigure;
            this.switchTab('basic');
            document.getElementById('figure-select').value = 'loaded';
            this.draw();
            
        } catch (error) {
            alert('Ошибка при создании фигуры вращения: ' + error.message);
        }
    }

    createSurface() {
        try {
            const funcType = document.getElementById('functionSelect').value;
            const xMin = parseFloat(document.getElementById('xMin').value);
            const xMax = parseFloat(document.getElementById('xMax').value);
            const yMin = parseFloat(document.getElementById('yMin').value);
            const yMax = parseFloat(document.getElementById('yMax').value);
            const gridSize = parseInt(document.getElementById('gridSize').value);
            
            if (isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax)) {
                alert('Пожалуйста, введите корректные значения диапазонов!');
                return;
            }
            
            this.surfaceFigure = SurfaceBuilder.createSurface(funcType, xMin, xMax, yMin, yMax, gridSize);
            this.currentFigure = this.surfaceFigure;
            this.switchTab('basic');
            document.getElementById('figure-select').value = 'loaded';
            this.draw();
            
        } catch (error) {
            alert('Ошибка при создании поверхности: ' + error.message);
        }
    }
    
    updateActiveButton(activeId) {
        document.querySelectorAll('.projection-buttons button').forEach(btn => {
            btn.classList.remove('active-button');
        });
        document.getElementById(activeId).classList.add('active-button');
    }
    
    projectPerspective(point) {
        const c = 5; // расстояние до плоскости проекции
        const scale = 100;
        
        const perspectiveMatrix = [
            [scale, 0, 0, 0],
            [0, -scale, 0, 0],
            [0, 0, 1, 0],
            [0, 0, -1/c, 1]
        ];
        
        let [x, y, z, w] = TransformationMatrix.multiplyMatrixVector(perspectiveMatrix, [...point, 1]);
        const adjustedW = Math.max(w, 0.1);
        
        return [
            (x / adjustedW) + this.canvas.width / 2,
            (y / adjustedW) + this.canvas.height / 2
        ];
    }
    
    projectAxonometric(point) {
        const scale = 80;
        const angle = Math.PI / 6; // 30 градусов
        
        const axonometricMatrix = [
            [Math.cos(angle), 0, -Math.sin(angle), 0],
            [Math.sin(angle)*Math.sin(angle), Math.cos(angle), Math.cos(angle)*Math.sin(angle), 0],
            [0, 0, 0, 0],
            [0, 0, 0, 1]
        ];
        
        let [x, y, z, w] = TransformationMatrix.multiplyMatrixVector(axonometricMatrix, [...point, 1]);
        
        return [
            x * scale + this.canvas.width / 2,
            this.canvas.height / 2 - y * scale
        ];
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.currentFigure) return;
        
        let transformMatrix = TransformationMatrix.getIdentityMatrix();
        
        // Применяем отражение
        const reflectionMatrix = TransformationMatrix.getReflectionMatrix(
            this.transformParams.reflectXY,
            this.transformParams.reflectXZ,
            this.transformParams.reflectYZ
        );
        transformMatrix = TransformationMatrix.multiplyMatrices(transformMatrix, reflectionMatrix);
        
        // Масштабирование относительно центра
        const scaleMatrix = TransformationMatrix.getScaleAroundCenterMatrix(
            this.transformParams.scale,
            this.currentFigure.center
        );
        transformMatrix = TransformationMatrix.multiplyMatrices(transformMatrix, scaleMatrix);
        
        // Остальные преобразования
        const transformations = [
            TransformationMatrix.getRotationXMatrix(this.transformParams.rotateX),
            TransformationMatrix.getRotationYMatrix(this.transformParams.rotateY),
            TransformationMatrix.getRotationZMatrix(this.transformParams.rotateZ),
            TransformationMatrix.getTranslationMatrix(
                this.transformParams.translateX,
                this.transformParams.translateY,
                this.transformParams.translateZ
            )
        ];
        
        transformations.forEach(matrix => {
            transformMatrix = TransformationMatrix.multiplyMatrices(transformMatrix, matrix);
        });
        
        // Преобразование и отрисовка
        const transformedVertices = this.currentFigure.vertices.map(vertex => {
            const transformed = TransformationMatrix.multiplyMatrixVector(transformMatrix, vertex.toArray());
            return this.currentProjection === 'perspective' 
                ? this.projectPerspective(transformed)
                : this.projectAxonometric(transformed);
        });
        
        // Отрисовка рёбер
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.currentFigure.faces.forEach(face => {
            this.ctx.beginPath();
            face.vertexIndices.forEach((vertexIndex, i) => {
                const [x, y] = transformedVertices[vertexIndex];
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            });
            const [firstX, firstY] = transformedVertices[face.vertexIndices[0]];
            this.ctx.lineTo(firstX, firstY);
            this.ctx.stroke();
        });
        
        // Отрисовка вершин
        this.ctx.fillStyle = '#e74c3c';
        transformedVertices.forEach(([x, y]) => {
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PolyhedronViewer();
});
