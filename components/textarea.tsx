import { forwardRef, useImperativeHandle, useState } from 'react';

interface TextAreaProps {
    initialValue?: string;
    placeholder?: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextArea = forwardRef<{ setValue: (value: string) => void }, TextAreaProps>(
    ({ initialValue = "", placeholder, onChange }, ref) => {
        const [inputValue, setInputValue] = useState(initialValue);

        useImperativeHandle(ref, () => ({
            setValue: (value: string) => {
                setInputValue(value);
            }
        }));

        return (
            <textarea
                className="w-full h-[200px] p-2 border border-gray-300 rounded-md resize-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-all duration-300"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    onChange(e);
                }}
                placeholder={placeholder}
            ></textarea>

        );
    }
);
export default TextArea;