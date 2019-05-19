module.exports = drawTable;

function drawTable({ headers, errorFromColumn, data }) {
    const columns = getColumns(data.concat(headers));
    console.log(getLine({ columns, entry: headers }));
    console.log(getLine({ columns, entry: {}, padding: "=" }));
    data.forEach(entry =>
        console.log(getLine({ columns, entry, errorFromColumn }))
    );
}

function getLine({
    columns,
    entry,
    errorFromColumn = 1,
    padding = " ",
    delimiter = "  "
}) {
    const containsError = entry && entry.error;
    return Object.entries(columns).reduce((result, [propName, length], idx) => {
        if (containsError) {
            if (idx > errorFromColumn) {
                return result;
            }
            if (idx === errorFromColumn) {
                const propValue = getSafePropVal(entry.error);
                return result + propValue.padEnd(length, padding) + delimiter;
            }
        }
        const propValue = getSafePropVal(entry[propName]);
        return result + propValue.padEnd(length, padding) + delimiter;
    }, "");
}

function getColumns(array) {
    return array.reduce((columns, nextEntry) => {
        Object.keys(nextEntry).forEach(propName => {
            const propVal = getSafePropVal(nextEntry[propName]);
            columns[propName] = Math.max(
                propVal.length,
                columns[propName] || 0
            );
        });
        delete columns.error;
        return columns;
    }, {});
}

function getSafePropVal(propVal) {
    if (propVal === undefined) {
        return "";
    }

    if (propVal === null) {
        return "-";
    }

    return propVal.toString();
}
