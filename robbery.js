'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var WEEK = {
    ПН: 10,
    ВТ: 11,
    СР: 12,
    Mon: 'ПН',
    Tue: 'ВТ',
    Wed: 'СР'
};

var HOUR = 60 * 60 * 1000;
var bankGMT;

function getTimePoint(busyTime, type, label) {
    function getTime(value) {
        value += bankGMT.value * HOUR;
        var date = new Date(value).toUTCString();
        var day = date.match(/^[a-z]{3}/i)[0];
        day = WEEK[day];
        var time = date.match(/\d\d:\d\d:\d\d/)[0];

        return { day: day, hours: time.match(/\d\d/g)[0], minutes: time.match(/\d\d/g)[1] };
    }

    var day = busyTime.match(/^[А-Я][А-Я]/)[0];
    day = WEEK[day];
    var hour = busyTime.match(/\d\d:\d\d/);
    busyTime = '2016-10-' + day + 'T' + hour + ':00' + getUTC(busyTime).note;
    var value = Date.parse(busyTime);
    var time = getTime(value);

    return { type: type, label: label, time: time, value: value };
}


function getUTC(time) {
    var UTC = time.match(/\d$/);
    if (UTC === null) {
        return '';
    }
    var value = parseInt(UTC);
    UTC = UTC[0].length > 1 ? UTC : '0' + UTC;

    return { note: '+' + UTC + '00', value: value };
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    var timePoints = []; // TimePoint.Keys: type, time, value, label
    var robberyTimePoints = [];
    duration = duration * 60 * 1000;

    bankGMT = getUTC(workingHours.from);

    function getBankTimePoints() {
        var dayStart = 'ПН 00:00+' + bankGMT.value;
        var dayEnd = 'СР 23:59+' + bankGMT.value;

        timePoints.push(
            getTimePoint(dayStart, 'from', 'Bank'),
            getTimePoint(dayEnd, 'to', 'Bank')
        );

        ['ПН', 'ВТ', 'СР'].forEach(function (day) {
            var open = day + ' ' + workingHours.from;
            var close = day + ' ' + workingHours.to;

            timePoints.push(
                getTimePoint(close, 'from', 'Bank'),
                getTimePoint(open, 'to', 'Bank')
            );
        });
    }

    function getGangTimePoints() {
        Object.keys(schedule).forEach(function (robber) {
            schedule[robber].forEach(function (busyTime) {
                timePoints.push(
                    getTimePoint(busyTime.from, 'from', robber),
                    getTimePoint(busyTime.to, 'to', robber)
                );
            });
        });
    }

    function getTimePoints() {
        getBankTimePoints();
        getGangTimePoints();
        timePoints.sort(function (a, b) {
            if (a.value < b.value) {
                return -1;
            }
            if (a.value > b.value) {
                return 1;
            }

            return 0;
        });
    }

    function getRobberyTimePoints() {
        var stack = [];

        timePoints.forEach(function (point) {
            if (point.type === 'from') {
                if (robberyTimePoints.length % 2 !== 0) {
                    robberyTimePoints.push(point);
                }
                stack.push(point);
            }

            if (point.type === 'to') {
                stack = stack.filter(function (item) {
                    return point.label !== item.label;
                });

                if (stack.length === 0) {
                    robberyTimePoints.push(point);
                }
            }
        });

        robberyTimePoints = selectRobberyTimePoints();
    }

    function selectRobberyTimePoints() {
        var points = [];
        for (var i = 0; i < robberyTimePoints.length - 1; i += 2) {
            if (robberyTimePoints[i + 1].value - robberyTimePoints[i].value >= duration) {
                points.push(robberyTimePoints[i]);
                points.push(robberyTimePoints[i + 1]);
            }
        }

        return points;
    }

    getTimePoints();
    getRobberyTimePoints();
    var index = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (robberyTimePoints.length === 0) {
                return false;
            }

            return true;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyTimePoints.length !== 0) {
                var date = robberyTimePoints[index].time;

                var dayRE = RegExp('(%[D][D])');
                var hoursRE = RegExp('(%[H][H])');
                var minutesRE = RegExp('(%[M][M])');

                return template
                    .replace(dayRE, date.day)
                    .replace(hoursRE, date.hours)
                    .replace(minutesRE, date.minutes);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {

            return false;
        }
    };
};
