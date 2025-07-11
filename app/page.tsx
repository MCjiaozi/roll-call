"use client";
import { useEffect, useState, useRef } from 'react';
import PromptBox, { PromptBoxProps } from '@/components/prompt-box';
import { BigButton, SmallButton } from '@/components/buttons';
import TextArea from '@/app/textarea';
export default function Home() {
    const [name, setName] = useState<string>("");
    const [history, setHistory] = useState<string[]>([]);
    const [nameList, setNameList] = useState<string[]>(defaultNameList);
    const [cycleSet, setCycleSet] = useState<Set<string>>(new Set());
    const [settings, setSettings] = useState<(boolean)[]>([true]);
    const [Prompt, setPrompt] = useState<{ ifShow: boolean, props: PromptBoxProps }>({ ifShow: false, props: {} });
    const inputArrayRef = useRef<string[]>(defaultNameList);
    const textAreaRef = useRef<{ setValue: (value: string) => void }>(null);
    function getOne() {
        const newName = nameList[Math.floor(Math.random() * nameList.length)];
        const newCycleSet = new Set(cycleSet);
        console.log("抽取到：", newName);
        if (settings[0] && cycleSet.has(newName) && cycleSet.size < nameList.length) {
            console.log("重复了，重新获取");
            return getOne();
        }
        else if (cycleSet.size >= nameList.length) { newCycleSet.clear(); console.log("已抽完所有人，清空循环集合"); }
        if (settings[0]) {
            newCycleSet.add(newName);
            setCycleSet(newCycleSet);
            saveArray('rollCallCycleSet', Array.from(newCycleSet));
            console.log("循环集合人数：", newCycleSet.size, newCycleSet);
        }

        const newHistory = [newName, ...history];
        setHistory(newHistory);
        saveArray('rollCallHistory', newHistory);

        setName(newName);
    }
    function handleSettingsChange(e: React.ChangeEvent<HTMLInputElement>) {
        const backupedSettings = [...settings];
        backupedSettings[Number(e.target.getAttribute('data-setting-number'))] = e.target.checked;
        setSettings(backupedSettings);
        saveArray('rollCallSettings', backupedSettings);
    }
    useEffect(() => {
        const loadedHistory = loadArray('rollCallHistory');
        if (loadedHistory.length > 0) {
            setHistory(loadedHistory);
            console.log("已加载历史记录：", loadedHistory);
        }
        const loadedNameList = loadArray('rollCallNameList');
        if (loadedNameList.length > 0) {
            setNameList(loadedNameList);
            inputArrayRef.current = loadedNameList;
            console.log("已加载名单：", loadedNameList);
        }
        const loadedSettings = loadArray('rollCallSettings');
        if (loadedSettings.length > 0) {
            setSettings(loadedSettings);
            console.log("已加载设置：", loadedSettings);
        }
        const loadedCycleSet = loadArray('rollCallCycleSet');
        if (loadedCycleSet.length > 0) {
            setCycleSet(new Set(loadedCycleSet));
            console.log("已加载循环集合：", loadedCycleSet);
        }
    }, [])
    return (
        <>
            <div className="text-center">
                <div className="text-8xl h-40 items-center flex justify-center font-bold">
                    {name || "待抽取"}
                </div>
                <BigButton onClick={getOne}>随机点名</BigButton>
                <div className="grid gap-2 m-2.5 justify-center grid-cols-[repeat(auto-fit,minmax(200px,400px))]">
                    <GirdCard>
                        历史记录（{history.length}）
                        <List list={history} />
                        <div>
                            <SmallButton onClick={() => {
                                setPrompt({
                                    ifShow: true, props: {
                                        title: "清除历史记录", children: <><div className="min-w-[260px]">确定要清除历史记录吗？此操作不可撤销。</div></>, buttons: [{
                                            text: "确定", onClick: () => {
                                                setHistory([]);
                                                saveArray('rollCallHistory', []);
                                                setPrompt({ ...Prompt, ifShow: false });
                                            }, stress: true
                                        }, {
                                            text: "取消", onClick: () => {
                                                setPrompt({ ...Prompt, ifShow: false });
                                            }, stress: false
                                        }]
                                    }
                                });
                            }}>清除</SmallButton>
                        </div>
                    </GirdCard>
                    <GirdCard>
                        名单（{nameList.length}）
                        <List list={nameList} />
                        <div>
                            <SmallButton onClick={() => {
                                setPrompt({
                                    ifShow: true, props: {
                                        title: "编辑名单", children:
                                            <>
                                                <div className="grid gap-2 m-2.5 justify-center grid-cols-[repeat(auto-fit,minmax(260px,400px))] text-center">
                                                    <div>
                                                        <div className="font-bold">直接编辑</div><div className="text-xs text-gray-500 mb-2 text-center">每行输入一个名字，自动删除空白字符。</div>
                                                        <div>
                                                            <TextArea ref={textAreaRef} initialValue={nameList.join("\n")} onChange={(e) => {
                                                                const editedArray = e.target.value.split("\n").map(item => item.trim()).filter(item => item.length > 0);
                                                                inputArrayRef.current = editedArray;
                                                            }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">从文件导入</div>
                                                        <SmallButton onClick={() => {
                                                            readTxtFileToList().then((res) => {
                                                                if (textAreaRef.current) {
                                                                    textAreaRef.current.setValue(res.join("\n"));
                                                                    inputArrayRef.current = res;
                                                                }
                                                            }).catch((e) => { console.log("读取文件失败。\n", e); });
                                                        }}>纯文本(.txt)</SmallButton>
                                                        <SmallButton onClick={() => {
                                                            readExcelFileToList().then((res) => {
                                                                if (textAreaRef.current) {
                                                                    textAreaRef.current.setValue(res.join("\n"));
                                                                    inputArrayRef.current = res;
                                                                }
                                                            }).catch((e) => { console.log("读取文件失败。\n", e); });
                                                        }}>Excel(.xlsx)</SmallButton>
                                                        <div className="text-xs text-gray-500 mb-2 text-center">纯文本：一行一个名字，使用UTF-8编码。<br />Excel：读取第一个工作表的第一列数据。</div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">导出到文件</div>
                                                        <SmallButton onClick={() => { exportToTXT(nameList, "NameList") }}>纯文本(.txt)</SmallButton>
                                                        <SmallButton onClick={() => { exportToExcel(nameList, "NameList") }}>Excel(.xlsx)</SmallButton>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 mb-2 text-center">若新旧名单不同，则自动清除循环集合。</div>
                                            </>
                                        , buttons: [{
                                            text: "保存", onClick: () => {
                                                if (JSON.stringify(nameList) !== JSON.stringify(inputArrayRef.current)) {
                                                    setNameList(inputArrayRef.current);
                                                    saveArray('rollCallNameList', inputArrayRef.current);
                                                    setCycleSet(new Set());
                                                    saveArray('rollCallCycleSet', []);
                                                }
                                                setPrompt({ ...Prompt, ifShow: false });
                                            }, stress: true
                                        }, {
                                            text: "取消", onClick: () => {
                                                setPrompt({ ...Prompt, ifShow: false });
                                            }, stress: false
                                        }]
                                    }
                                });
                            }}>编辑</SmallButton>
                        </div>
                    </GirdCard>
                    <GirdCard>
                        设置
                        <div className="p-2.5">
                            <label className="flex items-center justify-start select-none text-left"><input type="checkbox" className="form-checkbox accent-blue-600 h-4 w-4" onChange={handleSettingsChange} checked={settings[0]} data-setting-number={0} />&nbsp;<span>尽量减少重复<span className="text-xs text-gray-500">抽完所有人后再循环，中途不重复</span></span></label>
                        </div>
                        <SmallButton onClick={() => {
                            setPrompt({
                                ifShow: true, props: {
                                    title: "清除循环集合", children: <><div className="min-w-[260px]">确定要清除循环集合吗？此操作不可撤销。</div></>, buttons: [{
                                        text: "确定", onClick: () => {
                                            setCycleSet(new Set());
                                            saveArray('rollCallCycleSet', []);
                                            setPrompt({ ...Prompt, ifShow: false });
                                        }, stress: true
                                    }, {
                                        text: "取消", onClick: () => {
                                            setPrompt({ ...Prompt, ifShow: false });
                                        }, stress: false
                                    }]
                                }
                            });
                        }}>清除循环集合（{cycleSet.size}）</SmallButton>
                    </GirdCard>
                    <GirdCard>
                        使用说明

                        <div className="text-sm text-gray-500 text-left">
                            1.点名方式：点击“随机点名”按钮后，从名单中随机抽取一人。<br />
                            2.循环集合：勾选“尽量减少重复”后，每次点名会将已点名的人加入循环集合，直到所有人都被点名过一次。<br />
                            3.数据存储：点名结果、名单、循环集合和设置都会存储在浏览器的 LocalStorage 中，刷新页面不会丢失，但清除浏览器数据或使用隐私模式会导致数据丢失或不可见。
                        </div>
                    </GirdCard>
                </div>

                {
                    Prompt.ifShow && (
                        <>
                            <PromptBox title={Prompt.props.title} buttons={Prompt.props.buttons}>{Prompt.props.children}</PromptBox>
                        </>
                    )
                }
                <div className="h-[120px]"></div>
                <div className="fixed bottom-[50px] left-1/2 transform -translate-x-1/2 w-[146px]">
                    <BigButton onClick={getOne}>随机点名</BigButton>
                </div>
            </div>
        </>
    )
}
const defaultNameList = [
    "张三",
    "李四",
    "王五",
    "赵六",
    "钱七",
    "孙八",
    "周九",
    "吴十",
    "郑十一",
    "冯十二",
    "陈十三",
    "褚十四",
    "卫十五",
    "蒋十六",
    "沈十七",
    "韩十八",
    "杨十九",
    "朱二十",
    "秦二十一",
    "尤二十二",
]


const exportToTXT = (list: string[], fileName: string) => {
    const textContent = list.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 打开文件选择框，读取txt文件并返回内容数组（每行一个元素）
 * @returns - 包含文件内容的数组Promise
 */
const readTxtFileToList = (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.style.display = 'none';

        document.body.appendChild(input);

        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];

            if (!file) {
                reject(new Error('未选择文件'));
                return;
            }

            if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
                reject(new Error('请选择txt格式的文件'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                try {
                    const content = event.target?.result as string;
                    const list = content.split(/\r?\n/).filter(item => item.trim() !== '');
                    resolve(list);
                } catch (error) {
                    reject(new Error(`文件解析错误: ${(error as Error).message}`));
                } finally {
                    document.body.removeChild(input);
                }
            };

            reader.onerror = () => {
                reject(new Error(`文件读取失败: ${reader.error?.message || '未知错误'}`));
                document.body.removeChild(input);
            };

            reader.readAsText(file, 'utf-8');
        };

        input.click();
    });
}

/**
 * 存储数组到localStorage
 * @param key - 存储键名
 * @param array - 要存储的数组
 */
const saveArray = (key: string, array: any[]) => {
    try {
        localStorage.setItem(key, JSON.stringify(array));
    } catch (error) {
        console.error(`存储失败:`, error);
    }
}

/**
* 从localStorage读取数组
* @param key - 存储键名
* @returns 存储的数组，若失败则返回空数组
*/
const loadArray = (key: string): any[] => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error(`读取失败:`, error);
        return [];
    }
}

const GirdCard = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="inline-block p-2.5 rounded-md m-2.5 hover:shadow-lg transition-shadow duration-300 bg-[#ffffff] border border-gray-300">
            {children}
        </div>
    )
}
const List = ({ list }: { list: string[] }) => {
    return (
        <div className="text-left m-2.5 h-[200px] overflow-y-auto rounded-md">
            {list.map((item, index) => (
                <div key={index} className="text-lg hover:bg-blue-100 px-[7px] py-[2px]">
                    {item}
                </div>
            ))}
        </div>
    )
}

import * as XLSX from 'xlsx';

/**
 * 从Excel文件导入名单（支持.xlsx格式）
 * @returns 解析后的名单数组Promise
 */
const readExcelFileToList = (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) {
                reject(new Error('未选择文件'));
                document.body.removeChild(input);
                return;
            }

            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                reject(new Error('请选择Excel格式文件（.xlsx或.xls）'));
                document.body.removeChild(input);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    const nameList: string[] = [];
                    (jsonData as any[][]).forEach((row) => {
                        const name = row[0]?.toString().trim();
                        if (name && name.length > 0) {
                            nameList.push(name);
                        }
                    });

                    resolve(nameList);
                } catch (error) {
                    reject(new Error(`Excel解析错误: ${(error as Error).message}`));
                } finally {
                    document.body.removeChild(input);
                }
            };

            reader.onerror = () => {
                reject(new Error(`文件读取失败: ${reader.error?.message || '未知错误'}`));
                document.body.removeChild(input);
            };

            reader.readAsArrayBuffer(file);
        };

        input.click();
    });
};

/**
 * 导出名单到Excel文件
 * @param list 要导出的名单数组
 * @param fileName 导出的文件名（不含后缀）
 */
const exportToExcel = (list: string[], fileName: string) => {
    const wsData = list.map((name) => [name]);

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '名单');

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};