var schedule = function schedule (wrap, callback, data) {
    var callout = function schedule$_callout (result) {
            callback(schedule.transcode(result));
        },
        dd = function double_digit (num) {
            return (num < 10 ? "0" : "") + num;
        },
        weekdays = [
            "Su",
            "Mo",
            "Tu",
            "We",
            "Th",
            "Fr",
            "Sa"
        ],
        weekdayDescriptions = ["", "", "", "", "", "", ""],
        weekdayValues = [ "1", "2", "3", "4", "5", "6", "7" ],
        times = [],
        timeDescriptions = [],
        timeValues = [];

    (function build_time_labels () {
        times = [
            "EarlyBird",
            "Brunch",
            "Afternoon",
            "Evening",
            "NightOwl",
            "Insomniac"
        ];
        timeDescriptions = [
            "08:00 - 10:00",
            "10:00 - 16:00",
            "16:00 - 19:00",
            "19:00 - 22:00",
            "22:00 - 24:00",
            "00:00 - 08:00"
        ];
        timeValues = [ "1", "2", "3", "4", "5", "6" ];
    }());


    checkerboard("complete")
            .build({
                title: "",
                x: {
                    titles: weekdays,
                    descriptions: weekdayDescriptions,
                    values: weekdayValues
                },
                y: {
                    titles: times,
                    descriptions: timeDescriptions,
                    values: timeValues
                },
                data: schedule.transcodeBack(data)
            })
            .append(wrap)
            .listen(callout);
};

schedule.timeslots = {

    // Early Birds
    1: [ 8, 9 ],

    // Morning
    2: [ 10, 11, 12, 13, 14, 15 ],

    // Afternoon
    3: [ 16, 17, 18 ],

    // Evening
    4: [ 19, 20, 21 ],

    // Night Owls
    5: [ 22, 23 ],

    // Insomniacs
    6: [ 0, 1, 2, 3, 4, 5, 6, 7 ]
};

schedule.transcodeBack = function schedule$transcodeBack (input) {
    var val = [],
        find = function (num) {
            var result = null,
                key;
            for (key in schedule.timeslots) {
                if (schedule.timeslots.hasOwnProperty(key)) {
                    if (schedule.timeslots[key].indexOf(num) !== -1) {
                        result = key;
                    }
                }
            }
            return result;
        };

    input.forEach(function (slot) {
        var Day = parseInt(slot.Day, 10),
            From = parseInt(slot.From, 10),
            To = parseInt(slot.To, 10),
            s,
            i;
        for (i = From; i < To; i++) {
            s = find(i);
            if (s !== null) {
                val.push({
                    x: Day,
                    y: s
                });
            }
        }
    });
    return val;
};


schedule.transcode = function schedule$transcode (result) {

    // Starting hours of each time slot
    var group = function (day, times) {
            var start = null,
                last = null,
                list = [],
                _day = day;
            times = times.sort(function sortFunction (x, y) {
                return x - y;
            });

            times.forEach(function addupTimes (current) {

                // New set
                if (last === null) {
                    start = current;
                    last = current;
                    return;
                }

                // Sequential
                if (current === last + 1) {
                    last = current;
                    return;
                }

                // Skipped
                if (current > last + 1) {
                    list.push({
                        Day: _day,
                        From: start,
                        To: (last + 1)
                    });

                    // Reset
                    start = current;
                    last = current;
                }

            });

            list.push({
                Day: _day,
                From: start,
                To: (last + 1)
            });

            return list;
        },


        trans = {},
        collection = [];

    var days = {},
        key;

    result.forEach(function gatherResult (value) {
        if (!days.hasOwnProperty(value.x)) {
            days[value.x] = [];
        }
        days[value.x].push(parseInt(value.y, 10));
    });

    for (key in days) {
        if (days.hasOwnProperty(key)) {
            trans[key] =  [];

            // Translate time slots to actual hours
            days[key].forEach(function (item) {
                trans[key] = trans[key].concat(schedule.timeslots[parseInt(item)]);
            });

            // Group the time slots together
            collection = collection.concat(group(key, trans[key]));
        }
    }

    return collection;
};



schedule.markNow = function schedule$markNow () {
   var now = new Date();
   [].forEach.call(document.querySelectorAll("#schedule span.cell"),
        function markNow (box) {
            var x = parseInt(box.getAttribute("value-x"), 10),
                y = parseInt(box.getAttribute("value-y"), 10),
                today = now.getDay() + 1,
                thisHour = now.getHours();
            if (!isNaN(x) && !isNaN(y) &&
                    x === today &&
                    schedule.timeslots[y].indexOf(thisHour) !== -1) {
                box.classList.add("now");
            }
        });
};