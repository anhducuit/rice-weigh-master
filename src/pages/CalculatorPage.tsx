import { useState } from 'react';
import { Calculator, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';

const CalculatorPage = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const deleteLastChar = () => {
    if (display.length === 1 || (display.length === 2 && display[0] === '-')) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operation) {
      const currentValue = parseFloat(previousValue);
      let result = 0;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
      }

      setDisplay(String(result));
      setPreviousValue(String(result));
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    const currentValue = parseFloat(previousValue);
    let result = 0;

    switch (operation) {
      case '+':
        result = currentValue + inputValue;
        break;
      case '-':
        result = currentValue - inputValue;
        break;
      case '×':
        result = currentValue * inputValue;
        break;
      case '÷':
        result = inputValue !== 0 ? currentValue / inputValue : 0;
        break;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const formatDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    if (value.includes('.') && value.endsWith('.')) return value;
    if (value.includes('.')) {
      const parts = value.split('.');
      return parseFloat(parts[0]).toLocaleString('vi-VN') + '.' + parts[1];
    }
    return num.toLocaleString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Máy tính</h1>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          {/* Display */}
          <div className="bg-muted rounded-xl p-4 mb-4 min-h-[80px] flex flex-col justify-end items-end">
            {previousValue && operation && (
              <p className="text-muted-foreground text-sm">
                {formatDisplay(previousValue)} {operation}
              </p>
            )}
            <p className="text-3xl font-bold text-foreground break-all">
              {formatDisplay(display)}
            </p>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={clear}
            >
              C
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={deleteLastChar}
            >
              <Delete className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={() => performOperation('÷')}
            >
              ÷
            </Button>
            <Button
              variant="secondary"
              className="h-14 text-lg font-semibold bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => performOperation('×')}
            >
              ×
            </Button>

            {['7', '8', '9'].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-14 text-lg font-semibold"
                onClick={() => inputDigit(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="secondary"
              className="h-14 text-lg font-semibold bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => performOperation('-')}
            >
              −
            </Button>

            {['4', '5', '6'].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-14 text-lg font-semibold"
                onClick={() => inputDigit(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="secondary"
              className="h-14 text-lg font-semibold bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => performOperation('+')}
            >
              +
            </Button>

            {['1', '2', '3'].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-14 text-lg font-semibold"
                onClick={() => inputDigit(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              className="h-14 text-lg font-semibold row-span-2"
              onClick={calculate}
            >
              =
            </Button>

            <Button
              variant="outline"
              className="h-14 text-lg font-semibold col-span-2"
              onClick={() => inputDigit('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={inputDecimal}
            >
              ,
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default CalculatorPage;
