var checkerboard = (function __checkerboard__  () {
    var timelimit = 2000,
        touchdevice = false,
        combine = function combine () {
            var subject,
                combined = {},
                key;
            while (arguments.length) {
                subject = [].pop.call(arguments);
                if (typeof subject === "object") {
                    for (key in subject) {
                        if (subject.hasOwnProperty(key)) {
                            combined[key] = subject[key];
                        }
                    }
                }
            }
            return combined;
        },

        collection = [],
        Checkerboard = function Checkerboard (name) {
            this.name = name;
            this.wrap = document.createElement("div");
            this.editMode = false;
            this.allCells = [];
            // this.startX
            // this.startY
            // this.startActive
        };

    Checkerboard.prototype = {
        getAllCells: function Checkerboard$getAllCells () {
            return this.allCells;
            // return this.wrap.querySelectorAll("span.cell[axis-x][axis-y]");
        },
        buildCell: function Checkerboard$buildCell (text, attributes) {
            var cell = document.createElement("span"),
                key;

            for (key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    cell.setAttribute(key, attributes[key]);
                }
            }
            if (text) {
                cell.appendChild(document.createTextNode(text));
            }
            this.allCells.push(cell);
            return cell;
        },
        buildRow: function Checkerboard$buildRow (data) {
            var that = this,
                row = document.createElement("div"),
                i = 0,
                len = this.dataobj.x.titles.length;

            // title, description, titles, descriptions, attributes

            row.className = "row";

            // Row label
            row.appendChild(this.buildCell(data.title,
                    combine(data.attributes, {
                        "axis-x": "all",
                        "title": data.description || ""
                    })));

            // Row values
            for (; i < len; i++) {
                row.appendChild(this.buildCell((data.titles ? data.titles[i] : null),
                        combine(data.attributes, {
                            "axis-x": i + 1,
                            "value-x": that.dataobj.x.values[i],
                            "title": data.descriptions && data.descriptions[i] ?
                                    data.descriptions[i] : ""
                        })));
            }
            return row;
        },
        build: function Checkerboard$build (dataobj) {
            this.dataobj = dataobj;
            var that = this;
            var frag = document.createDocumentFragment();
            var loader = document.createElement("div");
            var overlay = document.createElement("div");
            loader.className = "loader";
            overlay.className = "overlay";

            // Build Head Row
            frag.appendChild(this.buildRow({
                        title: this.dataobj.title,
                        description: null,
                        titles: this.dataobj.x.titles,
                        descriptions: this.dataobj.x.descriptions,
                        attributes: {
                            "axis-y": "all",
                            "class": "cell"
                        }
                    }));

            // Build Body Rows
            dataobj.y.values.forEach(function Checkerboard$buildBodyRow (name, index) {
                frag.appendChild(that.buildRow({
                            title: that.dataobj.y.titles[index],
                            description: that.dataobj.y.descriptions[index],
                            titles: null,
                            descriptions: null,
                            attributes: {
                                "axis-y": index + 1,
                                "value-y": that.dataobj.y.values[index],
                                "class": "cell"
                            }
                        }));
            });

            // Fill in the data (if exists)
            if (this.dataobj.data) {
                this.dataobj.data.forEach(function fillCoordinate (coordinate) {
                    var cell = frag.querySelector("*[axis-x=\"" + coordinate.x + "\"][axis-y=\"" + coordinate.y + "\"]");
                    if (cell !== null) {
                        cell.setAttribute("active", "true");
                    }
                });
            }

            frag.appendChild(overlay);
            frag.appendChild(loader);
            that.wrap.appendChild(frag);

            return this;
        },
        progress: function Checkerboard$progress (evt, callback) {
            var x = evt.target.getAttribute("axis-x"),
                y = evt.target.getAttribute("axis-y"),
                xFrom, xTo, yFrom, yTo,
                xI, yI,
                e,
                that = this;

            if (x === null || y === null) { return; }
            x = parseInt(x);
            y = parseInt(y);

            if (this.editMode === true) {
                [].forEach.call(this.getAllCells(), function (cell) {
                    cell.classList.remove("dragging-on");
                    cell.classList.remove("dragging-off");
                });

                xFrom = x < that.startX ? x : that.startX;
                xTo   = x < that.startX ? that.startX : x;
                yFrom = y < that.startY ? y : that.startY;
                yTo   = y < that.startY ? that.startY : y;

                for (xI = xFrom; xI <= xTo; xI++) {
                    for (yI = yFrom; yI <= yTo; yI++) {
                        e = that.wrap.querySelector("*[axis-x=\"" + xI + "\"][axis-y=\"" + yI + "\"]");
                        if (e !== null) {
                            callback(e);
                        }
                    }
                }
            }
        },
        listen: function Checkerboard$listen (callback, loading) {
            var that = this;
            that.callback = callback;
            that.loading = loading;

            [
                "mousedown",
                "touchstart"
            ].forEach(function Checkerboard$startListeners (name) {
                that.wrap.addEventListener(name, function Checkerboard$startListener (evt) {

                    if (evt.type.toLowerCase() === "touchstart") {
                        touchdevice = true;
                    }

                    if (that.timer !== null) {
                        clearTimeout(that.timer);
                    }

                    var x = evt.target.getAttribute("axis-x"),
                        y = evt.target.getAttribute("axis-y"),
                        active = evt.target.getAttribute("active");

                    if (x === null || y === null) { return; }
                    x = parseInt(x);
                    y = parseInt(y);

                    if (that.editMode === false) {
                        that.startX = x;
                        that.startY = y;
                        that.startActive = active;
                        that.editMode = true;
                    }
                });
            });

            [
                "mouseup",
                "touchend",
                "touchcancel"
            ].forEach(function Checkerboard$endListeners (name) {
                that.wrap.addEventListener(name, function Checkerboard$endListener (evt) {
                    if (that.editMode === false) { return; }
                    that.progress(evt, function Checkerboard$endProgress (e) {
                        if (that.startActive === "true") {
                            e.removeAttribute("active");
                        } else {
                            e.setAttribute("active", "true");
                        }
                        // e.setAttribute("active", (that.startActive === "true" ? "false" : "true"));
                    });
                    that.editMode = false;
                    that.collect();
                });
            });

            [
                "mousemove",
                "touchmove"
            ].forEach(function Checkerboard$moveListeners (name) {
                that.wrap.addEventListener(name, function Checkerboard$moveListener (evt) {
                    if (that.editMode === false) { return; }
                    evt.preventDefault();
                    that.progress(evt, function (e) {
                        e.classList.add((that.startActive === "true" ? "dragging-off" : "dragging-on"));
                    });
                });
            });

        [
            "click"
        ].forEach(function Checkerboard$clickListeners (name) {
            that.wrap.addEventListener(name, function Checkerboard$clickListener (evt) {
                var x = evt.target.getAttribute("axis-x"),
                    y = evt.target.getAttribute("axis-y"),
                    target;

                if (x === null || y === null) { return; }
                if (x === "all") {
                    [].forEach.call(that.wrap.querySelectorAll("*[value-x][axis-y=\"" + y + "\"]"),
                            function Checkerboard$markColumn (e) {
                                e.setAttribute("active", "true");
                            });
                }
                if (y === "all") {
                    [].forEach.call(that.wrap.querySelectorAll("*[value-y][axis-x=\"" + x + "\"]"),
                            function Checkerboard$markRow (e) {
                                e.setAttribute("active", "true");
                            });
                }
                if (touchdevice && !isNaN(parseInt(x, 10)) && !isNaN(parseInt(y, 10))) {
                    target = that.wrap.querySelector("*[value-y=\"" + y + "\"][axis-x=\"" + x + "\"]");
                    target.setAttribute("active", (target.getAttribute("active") === "true" ? "false" : "true" ));
                }
                that.collect();
            });
        });

            return this;
        },
        append: function Checkerboard$append (parent) {
            parent.appendChild(this.wrap);
            return this;
        },
        collect: function Checkerboard$collect () {
            var result = [],
                that = this,
                allCells = this.getAllCells();
            if (this.timer !== null) {
                clearTimeout(this.timer);
            }
            allCells.sort(function sortCells (a, b) {
                var A = {
                        x: parseInt(a.getAttribute("axis-x"), 10),
                        y: parseInt(a.getAttribute("axis-y"), 10)
                    },
                    B = {
                        x: parseInt(b.getAttribute("axis-x"), 10),
                        y: parseInt(b.getAttribute("axis-y"), 10)
                    };
                if (A.x === B.x) {
                    return A.y > B.y ? 1 : -1;
                }
                return A.x > B.x ? 1 : -1;
            });
            [].forEach.call(allCells, function allCells (cell) {
                if (cell.getAttribute("active") === "true") {
                    result.push({
                        x: cell.getAttribute("value-x"),
                        y: cell.getAttribute("value-y")
                    });
                }
            });
            if (that.editMode === false) {
                this.timer = setTimeout(function callbackTimer () {
                    if (typeof that.callback === "function") {
                        that.loading();
                        that.callback(result);
                    }
                }, timelimit);
            }
        }
    };



    return function checkerboard (name) {
        var found;
        if (typeof name !== "string") {
            return null;
        }
        name = name.toLowerCase();
        collection.forEach(function findCheckerboard (Checkerboard, index) {
            if (Checkerboard.name === name) {
                found = index;
            }
        });
        if (typeof found === "number") {
            return collection[found];
        }
        found = new Checkerboard(name);
        collection.push(found);
        return found;
    };
}());