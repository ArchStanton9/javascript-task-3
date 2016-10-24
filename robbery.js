'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

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
    duration = duration * 60 * 1000;

    var WEEK = {
        ПН: 'Mon, 10 ',
        ВТ: 'Tue, 11 ',
        СР: 'Wed, 12 '
    };

    function convertTime(time) {
        var day = time.match(/^[А-Я][А-Я]/);
        day = WEEK[day];
        time = time.replace(/^([А-Я][А-Я]\s)(\d\d:\d\d)(\+)(\d)$/, 'Oct 2016 $2:00 +0$400');
        // format: Mon, 10 Oct 2016 13:30:00 +0500

        return Date.parse(day + time);
    }

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

    getBankTimePoints();

    function getBankTimePoints() {
        var GMT = workingHours.to.match(/\d$/)[0];

        var dayStart = 'ПН 00:00+' + GMT;
        var dayEnd = 'СР 23:59+' + GMT;

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

    timePoints.sort(function (a, b) {
        if (a.value < b.value) {
            return -1;
        }
        if (a.value > b.value) {
            return 1;
        }

        return 0;
    });

    timePoints = findRobberyTime();

    function findRobberyTime() {
        var robberyTime = [];
        var stack = [];

        timePoints.forEach(function (point) {
            if (point.type === 'from') {
                if (robberyTime.length % 2 !== 0) {
                    robberyTime.push(point);
                }
                stack.push(point);
            }

            if (point.type === 'to') {
                stack = stack.filter(function (item) {
                    return point.label !== item.label;
                });

                if (stack.length === 0) {
                    robberyTime.push(point);
                }
            }
        });

        return robberyTime;
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            for (var i = 0; i < timePoints.length - 1; i += 2) {
                if (timePoints[i + 1].value - timePoints[i].value >= duration) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            for (var i = 0; i < timePoints.length - 1; i += 2) {
                if (timePoints[i + 1].value - timePoints[i].value >= duration) {
                    var time = new Date(timePoints[i].value);
                    var day = timePoints[i].time.match(/^[А-Я][А-Я]/)[0];
                    time = time.toTimeString().match(/\d\d:\d\d/)[0];

                    var dayRE = RegExp('(%[D][D])');
                    var timeRE = RegExp('(%[H][H]:%[M][M])');

                    return template.replace(dayRE, day).replace(timeRE, time);
                }
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
