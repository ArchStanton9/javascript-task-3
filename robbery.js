'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var WEEK = ['ПН', 'ВТ', 'СР'];

var DAY = 1440;
var HOUR = 60;
var bankUTC;

/**
 * Создает временную отметку
 * @param {Sting} busyTime – время
 * @param {String} type - тип отметки: либо 'from' - начало дела, либо 'to' - конец дела
 * @param {String} label - имя занятого ганстера или 'bank'
 * @returns {Object}
 */
function getTimePoint(busyTime, type, label) {
    return {
        type: type,
        label: label,
        value: getTimeValue(busyTime)
    };
}

/**
 * Конверирует время в чиловое значение минут, прошедших с начала недели
 * @param {String} time – Время в формате 'ПН 10:00+5'
 * @returns {Number}
 */
function getTimeValue(time) {
    var day = time.match(/^[А-Я]{2}/)[0];
    var hour = time.match(/\d{2}/g)[0];
    var minute = time.match(/\d{2}/g)[1];

    return [
        DAY * WEEK.indexOf(day),
        HOUR * parseInt(hour, 10),
        parseInt(minute, 10),
        HOUR * (bankUTC - getUTC(time))
    ].reduce(function (a, b) {
        return a + b;
    });
}

/**
 * Возвращает время в часовом поясе банка
 * @param {Number} value – кол-во минут прошедших с начала недели
 * @returns {Object}
 */
function getTime(value) {
    var day = Math.floor(value / DAY);
    value = value % DAY;
    var hour = Math.floor(value / HOUR);
    var minute = value % HOUR;

    return {
        day: WEEK[day],
        hour: hour > 9 ? hour.toString() : '0' + hour,
        minute: minute > 9 ? minute.toString() : '0' + minute
    };

}

/**
 * Возвращает часовой пояс полученного времени
 * @param {String} time – Время события, например 'ПН 10:00+5'
 * @returns {Number}
 */
function getUTC(time) {
    var UTC = time.split('+')[1];

    return parseInt(UTC, 10);
}

/**
 * Создает массив временных отметок Банды
 * @param {Object} schedule – Расписание Банды
 * @param {String} workingHours – Время работы банка
 * @returns {Object[]}
 */
function getTimePoints(schedule, workingHours) {
    var timePoints = [];
    var dayStart = ['ПН 00:00', bankUTC].join('+');
    var dayEnd = ['СР 23:59', bankUTC].join('+');

    timePoints.push(
        getTimePoint(dayStart, 'from', 'Bank'),
        getTimePoint(dayEnd, 'to', 'Bank')
    );

    WEEK.forEach(function (day) {
        var open = [day, workingHours.from].join(' ');
        var close = [day, workingHours.to].join(' ');

        timePoints.push(
            getTimePoint(close, 'from', 'Bank'),
            getTimePoint(open, 'to', 'Bank')
        );
    });

    Object.keys(schedule).forEach(function (robber) {
        schedule[robber].forEach(function (busyTime) {
            timePoints.push(
                getTimePoint(busyTime.from, 'from', robber),
                getTimePoint(busyTime.to, 'to', robber)
            );
        });
    });

    return timePoints;
}

/**
 * Возвращает массив отметок времени в которые можно начать ограбление
 * @param {Object[]} timePoints - массив временных отметок
 * @param {Number} duration - время ограбления
 * @returns {Object[]}
 */
function getRobberyTimePoints(timePoints, duration) {
    var stack = [];
    var freeTimePoints = [];
    var robberyTimePoints = [];

    timePoints.sort(function (a, b) {
        return a.value - b.value;
    });

    timePoints.forEach(function (point) {
        switch (point.type) {
            case 'from':
                if (freeTimePoints.length % 2 !== 0) {
                    freeTimePoints.push(point);
                }
                stack.push(point);
                break;

            case 'to':
                stack = stack.filter(function (item) {
                    return point.label !== item.label;
                });

                if (stack.length === 0) {
                    freeTimePoints.push(point);
                }
                break;

            default:
                break;
        }
    });

    for (var i = 0; i < freeTimePoints.length - 1; i += 2) {
        if (freeTimePoints[i + 1].value - freeTimePoints[i].value >= duration) {
            robberyTimePoints.push(freeTimePoints[i], freeTimePoints[i + 1]);
        }
    }

    return robberyTimePoints;
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
    var timePoints = []; // TimePoint.Keys: type, time, value, label
    var robberyTimePoints = [];
    bankUTC = getUTC(workingHours.from);

    timePoints = getTimePoints(schedule, workingHours);
    robberyTimePoints = getRobberyTimePoints(timePoints, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(robberyTimePoints.length);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyTimePoints.length) {
                var time = getTime(robberyTimePoints[0].value);

                return template
                    .replace(/(%[D][D])/, time.day)
                    .replace(/(%[H][H])/, time.hour)
                    .replace(/(%[M][M])/, time.minute);
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
