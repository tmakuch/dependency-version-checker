module.exports = drawTable;

function drawTable({ headers, customEntry, data }) {
  const columns = Object.entries(getColumns(data.concat(headers))).reduce(
    (result, [columnName, columnWidth]) => {
      if (headers[columnName]) {
        result[columnName] = columnWidth;
      }
      return result;
    },
    {},
  );
  console.log(getLine({ columns, entry: headers }));
  console.log(getLine({ columns, entry: {}, padding: "=" }));
  data.forEach((entry) =>
    console.log(getLine({ columns, entry, customEntry })),
  );
}

function getLine({
  columns,
  entry,
  customEntry: {
    getter: customEntryGetter,
    fromColumn: rawCustomEntryFromColumn,
  } = {},
  padding = " ",
  delimiter = "  ",
}) {
  const isCustomEntryApplicable = customEntryGetter && customEntryGetter(entry);
  const customEntryFromColumn =
    rawCustomEntryFromColumn && rawCustomEntryFromColumn.call
      ? rawCustomEntryFromColumn(entry)
      : rawCustomEntryFromColumn;
  return Object.entries(columns).reduce((result, [propName, length], idx) => {
    if (isCustomEntryApplicable) {
      if (idx > customEntryFromColumn) {
        return result;
      }
      if (idx === customEntryFromColumn) {
        const propValue = getSafePropVal(customEntryGetter(entry));
        return result + propValue.padEnd(length, padding) + delimiter;
      }
    }
    const propValue = getSafePropVal(entry[propName]);
    return result + propValue.padEnd(length, padding) + delimiter;
  }, "");
}

function getColumns(array) {
  return array.reduce((columns, nextEntry) => {
    Object.keys(nextEntry).forEach((propName) => {
      const propVal = getSafePropVal(nextEntry[propName]);
      columns[propName] = Math.max(propVal.length, columns[propName] || 0);
    });
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
