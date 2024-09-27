import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

interface KospiStock {
  code: string;
  name: string;
}

interface StockSelectorProps {
  stocks: KospiStock[];
  onSelect?: (stock: KospiStock) => void;
}

export function StockSelector({ stocks, onSelect }: StockSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStocks = stocks.filter(stock =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Input
        type="text"
        placeholder="종목 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul>
        {filteredStocks.map(stock => (
          <li key={stock.code} onClick={() => onSelect && onSelect(stock)}>
            {stock.name} ({stock.code})
          </li>
        ))}
      </ul>
    </div>
  );
}
