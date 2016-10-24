'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var WEEK = {
    ПН: 'Mon, 10 ',
    ВТ: 'Tue, 11 ',
    СР: 'Wed, 12 '
};

var HOUR = 60 * 60 * 1000;

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
    var bankGMT;
    duration = duration * 60 * 1000;

    function convertTime(time) {
        var day = time.match(/^[А-Я][А-Я]/);
        day = WEEK[day];
        time = time.replace(/^([А-Я][А-Я]\s)(\d\d:\d\d)(\+)(\d)$/, 'Oct 2016 $2:00 +0$400');
        // format: Mon, 10 Oct 2016 13:30:00 +0500

        return Date.parse(day + time);
    }

    function getGangTimePoints() {
        Object.keys(schedule).forEach(function (robber) {
            schedule[robber].forEach(function (busyTime) {
                timePoints.push(
                    { type: 'from', time: busyTime.from, value: convertTime(busyTime.from),
                        label: robber },
                    { type: 'to', time: busyTime.to, value: convertTime(busyTime.to),
                        label: robber }
                );
            });
        });
    }

    function getBankTimePoints() {
        bankGMT = workingHours.to.match(/[\+]\d$/)[0];
        var dayStart = 'ПН 00:00' + bankGMT;
        var dayEnd = 'СР 23:59' + bankGMT;
        bankGMT = parseInt(bankGMT);

        timePoints.push(
            { type: 'from', time: dayStart, value: convertTime(dayStart), label: 'Bank' },
            { type: 'to', time: dayEnd, value: convertTime(dayEnd), label: 'Bank' }
        );

        Object.keys(WEEK).forEach(function (day) {
            var open = day + ' ' + workingHours.from;
            var close = day + ' ' + workingHours.to;

            timePoints.push(
                { type: 'to', time: open, value: convertTime(open), label: 'Bank' },
                { type: 'from', time: close, value: convertTime(close), label: 'Bank' }
            );
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
                var time = new Date(robberyTimePoints[index].value + bankGMT * HOUR);
                var day = robberyTimePoints[index].time.match(/^[А-Я][А-Я]/)[0];
                time = time.toUTCString().match(/\d\d:\d\d/)[0];

                var dayRE = RegExp('(%[D][D])');
                var timeRE = RegExp('(%[H][H]:%[M][M])');

                return template.replace(dayRE, day).replace(timeRE, time);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (index + 2 < robberyTimePoints.length) {
                var time = robberyTimePoints[index + 1].value - robberyTimePoints[index].value;
                if (time >= duration + HOUR / 2) {
                    robberyTimePoints[index].value += HOUR / 2;

                    return true;
                }
                index += 2;

                return true;
            }

            return false;
        }
    };
};
