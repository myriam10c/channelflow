import React from 'react';

interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  clickable?: boolean;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  striped?: boolean;
  hoverable?: boolean;
}

// Table Header Cell
function TableHeader({
  children,
  className = '',
  ...props
}: TableHeaderProps) {
  return (
    <th
      className={`px-4 py-3 text-left text-sm font-semibold text-slate-300 bg-slate-800/50 border-b border-slate-700 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

// Table Body
function TableBody({
  children,
  className = '',
  ...props
}: TableBodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

// Table Row
function TableRow({
  children,
  clickable = false,
  className = '',
  ...props
}: TableRowProps) {
  return (
    <tr
      className={`border-b border-slate-700 hover:bg-slate-800/50 transition-colors duration-200 ${
        clickable ? 'cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

// Table Cell
function TableCell({
  children,
  align = 'left',
  className = '',
  ...props
}: TableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={`px-4 py-3 text-sm text-slate-300 ${alignClasses[align]} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

// Main Table Component
function Table({
  children,
  striped = false,
  hoverable = true,
  className = '',
  ...props
}: TableProps) {
  const stripedClasses = striped
    ? '[&>tbody>tr:nth-child(odd)]:bg-slate-800/30'
    : '';

  const hoverableClasses = hoverable ? '[&>tbody>tr]:hover:bg-slate-800/50' : '';

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table
        className={`w-full border-collapse bg-slate-900 ${stripedClasses} ${hoverableClasses} ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableCell };
export default Table;
