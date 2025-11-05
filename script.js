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
        if (reflectXY) matrix[2][2] = -1;
        if (reflectXZ) matrix[1][1] = -1;
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
    
    // Вращение вокруг произвольной прямой (матрица Родригеса)
    static getRotationAroundLineMatrix(pointA, pointB, angle) {
        const [ax, ay, az] = pointA.toArray();
        const [bx, by, bz] = pointB.toArray();
        
        // Вектор направления прямой
        const u = bx - ax;
        const v = by - ay;
        const w = bz - az;
        
        const length = Math.sqrt(u*u + v*v + w*w);
        if (length === 0) return this.getIdentityMatrix();
        
        const l = u / length;
        const m = v / length;
        const n = w / length;
        
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const oneMinusCosA = 1 - cosA;
        
        // Матрица вращения Родригеса
        const rotationMatrix = [
            [
                l*l*oneMinusCosA + cosA,
                m*l*oneMinusCosA - n*sinA,
                n*l*oneMinusCosA + m*sinA,
                0
            ],
            [
                l*m*oneMinusCosA + n*sinA,
                m*m*oneMinusCosA + cosA,
                n*m*oneMinusCosA - l*sinA,
                0
            ],
            [
                l*n*oneMinusCosA - m*sinA,
                m*n*oneMinusCosA + l*sinA,
                n*n*oneMinusCosA + cosA,
                0
            ],
            [0, 0, 0, 1]
        ];
        
        // Комбинируем с трансляцией к началу координат и обратно
        const toOrigin = this.getTranslationMatrix(-ax, -ay, -az);
        const fromOrigin = this.getTranslationMatrix(ax, ay, az);
        
        let matrix = this.multiplyMatrices(toOrigin, rotationMatrix);
        return this.multiplyMatrices(matrix, fromOrigin);
    }
    
    // Вращение вокруг прямой через центр, параллельной координатной оси
    static getRotationAroundParallelAxisMatrix(axis, angle, offsetY, offsetZ, center) {
        // Создаем точку на прямой, проходящей через центр и параллельной выбранной оси
        let pointOnLine;
        switch(axis) {
            case 'x':
                pointOnLine = new Point3D(center.x, center.y + offsetY, center.z + offsetZ);
                break;
            case 'y':
                pointOnLine = new Point3D(center.x + offsetY, center.y, center.z + offsetZ);
                break;
            case 'z':
                pointOnLine = new Point3D(center.x + offsetY, center.y + offsetZ, center.z);
                break;
        }
        
        // Создаем вторую точку на прямой (смещенную по направлению оси)
        let directionPoint;
        switch(axis) {
            case 'x':
                directionPoint = new Point3D(pointOnLine.x + 1, pointOnLine.y, pointOnLine.z);
                break;
            case 'y':
                directionPoint = new Point3D(pointOnLine.x, pointOnLine.y + 1, pointOnLine.z);
                break;
            case 'z':
                directionPoint = new Point3D(pointOnLine.x, pointOnLine.y, pointOnLine.z + 1);
                break;
        }
        
        // Используем метод для вращения вокруг произвольной прямой
        return this.getRotationAroundLineMatrix(pointOnLine, directionPoint, angle);
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
            reflectXY: false, reflectXZ: false, reflectYZ: false,
            lineA: new Point3D(0, 0, 0),
            lineB: new Point3D(1, 0, 0),
            rotationAngle: 0,
            parallelAxis: 'x',
            parallelOffsetY: 0,
            parallelOffsetZ: 0,
            parallelRotationAngle: 0
        };
        
        this.currentFigure = this.figures[2];
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
        const t = (1 + Math.sqrt(5)) / 2;
        const r = 1 / t;
        
        const vertices = [];
        
        const signs = [
            [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
            [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]
        ];
        
        signs.forEach(s => vertices.push([s[0], s[1], s[2]]));
        
        const patterns = [
            [0, r, t], [0, r, -t], [0, -r, t], [0, -r, -t],
            [r, t, 0], [r, -t, 0], [-r, t, 0], [-r, -t, 0],
            [t, 0, r], [t, 0, -r], [-t, 0, r], [-t, 0, -r]
        ];
        
        patterns.forEach(pattern => vertices.push(pattern));
        
        const faces = [
            [0, 8, 10, 2, 16], [0, 16, 18, 1, 9], [0, 9, 11, 3, 8],
            [1, 13, 15, 3, 9], [1, 18, 19, 5, 13],
            [2, 10, 12, 4, 17], [2, 17, 19, 5, 16],
            [3, 11, 14, 6, 15], [4, 12, 14, 6, 7],
            [4, 7, 19, 5, 17], [6, 7, 18, 1, 15], [7, 18, 16, 2, 17]
        ];
        
        return new Polyhedron(vertices, faces);
    }
    
    setupEventListeners() {
        document.getElementById('figure-select').addEventListener('change', (e) => {
            this.currentFigure = this.figures[e.target.value];
            this.draw();
        });
        
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
        
        document.getElementById('angleRotationLine').addEventListener('input', (e) => {
            this.transformParams.rotationAngle = parseFloat(e.target.value) * Math.PI / 180;
            document.getElementById('angleValue').textContent = `${e.target.value}°`;
            this.draw();
        });
        
        ['Ax', 'Ay', 'Az', 'Bx', 'By', 'Bz'].forEach(coord => {
            document.getElementById(`${coord}Input`).addEventListener('input', (e) => {
                const point = coord[0] === 'A' ? this.transformParams.lineA : this.transformParams.lineB;
                const axis = coord[1].toLowerCase();
                point[axis] = parseFloat(e.target.value);
                this.draw();
            });
        });
        
        // Обработчики для вращения вокруг параллельной оси
        ['parallelX', 'parallelY', 'parallelZ'].forEach(axis => {
            document.getElementById(axis).addEventListener('click', () => {
                this.transformParams.parallelAxis = axis.slice(-1).toLowerCase();
                this.updateActiveParallelButton(axis);
                this.draw();
            });
        });
        
        document.getElementById('parallelOffsetY').addEventListener('input', (e) => {
            this.transformParams.parallelOffsetY = parseFloat(e.target.value);
            document.getElementById('parallelOffsetYValue').textContent = e.target.value;
            this.draw();
        });
        
        document.getElementById('parallelOffsetZ').addEventListener('input', (e) => {
            this.transformParams.parallelOffsetZ = parseFloat(e.target.value);
            document.getElementById('parallelOffsetZValue').textContent = e.target.value;
            this.draw();
        });
        
        document.getElementById('parallelRotation').addEventListener('input', (e) => {
            this.transformParams.parallelRotationAngle = parseFloat(e.target.value) * Math.PI / 180;
            document.getElementById('parallelRotationValue').textContent = `${e.target.value}°`;
            this.draw();
        });
        
        this.updateActiveParallelButton('parallelX');
    }
    
    updateActiveButton(activeId) {
        document.querySelectorAll('.projection-buttons button').forEach(btn => {
            btn.classList.remove('active-button');
        });
        document.getElementById(activeId).classList.add('active-button');
    }
    
    updateActiveParallelButton(activeId) {
        document.querySelectorAll('.parallel-buttons button').forEach(btn => {
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
        
        let transformMatrix = TransformationMatrix.getIdentityMatrix();
        
        // Вращение вокруг произвольной прямой
        if (this.transformParams.rotationAngle !== 0) {
            const rotationMatrix = TransformationMatrix.getRotationAroundLineMatrix(
                this.transformParams.lineA,
                this.transformParams.lineB,
                this.transformParams.rotationAngle
            );
            transformMatrix = TransformationMatrix.multiplyMatrices(transformMatrix, rotationMatrix);
        }
        
        // Вращение вокруг прямой через центр, параллельной координатной оси
        if (this.transformParams.parallelRotationAngle !== 0) {
            const parallelRotationMatrix = TransformationMatrix.getRotationAroundParallelAxisMatrix(
                this.transformParams.parallelAxis,
                this.transformParams.parallelRotationAngle,
                this.transformParams.parallelOffsetY,
                this.transformParams.parallelOffsetZ,
                this.currentFigure.center
            );
            transformMatrix = TransformationMatrix.multiplyMatrices(transformMatrix, parallelRotationMatrix);
        }
        
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
            ),
            TransformationMatrix.getReflectionMatrix(
                this.transformParams.reflectXY,
                this.transformParams.reflectXZ,
                this.transformParams.reflectYZ
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
        this.ctx.lineWidth = 2;
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
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Отрисовка прямой для вращения
        this.drawRotationLine();
    }
    
    drawRotationLine() {
        const project = this.currentProjection === 'perspective' 
            ? this.projectPerspective.bind(this) 
            : this.projectAxonometric.bind(this);
        
        const pointA = this.transformParams.lineA.toArray();
        const pointB = this.transformParams.lineB.toArray();
        
        const projectedA = project(pointA);
        const projectedB = project(pointB);
        
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(projectedA[0], projectedA[1]);
        this.ctx.lineTo(projectedB[0], projectedB[1]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Отрисовка точек A и B
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.arc(projectedA[0], projectedA[1], 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(projectedB[0], projectedB[1], 5, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PolyhedronViewer();
});