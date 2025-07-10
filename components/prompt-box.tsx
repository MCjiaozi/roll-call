"use client";

import { SmallButton } from "./buttons";

type ButtonConfig = {
    text?: string;
    stress?: boolean;
    onClick?: () => void;
}
export type PromptBoxProps = { title?: string, children?: React.ReactNode, mask?: boolean, buttons?: ButtonConfig[] }
export default function PromptBox({ title = "标题", children = <></>, mask = true, buttons = [{ text: "确认", stress: true, onClick: () => { } }, { text: "取消", stress: false, onClick: () => { } }] }: PromptBoxProps) {
    return (
        <>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white shadow-lg shadow-black/30 rounded-lg p-8">
                <div className="text-4xl font-bold mb-4">{title}</div>
                <div className="text-lg text-left">{children}</div>
                <div className="mt-4">
                    {buttons.map((item, index) => (
                        <span key={index}>
                            <SmallButton onClick={item.onClick} stress={item.stress}>{item.text}</SmallButton>
                        </span>
                    ))}
                </div>
            </div>
            {mask && <div className="fixed inset-0 bg-black/50 z-9" />}
        </>
    )

}