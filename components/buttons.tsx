const BigButton = ({ onClick = () => { }, children = (<></>), stress = true }: { onClick?: () => void, children?: React.ReactNode, stress?: boolean }) => {
    return (
        <div onClick={onClick} className="inline-block hover:shadow-lg hover:shadow-black/20 transition-shadow duration-300" style={{
            padding: "10px 20px",
            backgroundColor: stress ? "#0070f3" : "#ffffff",
            color: stress ? "#fff" : "#0070f3",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: 24,
            userSelect: "none",
            margin: "0 5px",
            border: stress ? "none" : "1px solid #0070f3",
        }}>
            {children}
        </div>
    )
}
const SmallButton = ({ onClick = () => { }, children = (<></>), stress = true }: { onClick?: () => void, children?: React.ReactNode, stress?: boolean }) => {
    return (
        <div onClick={onClick} className="inline-block hover:shadow-lg hover:shadow-black/20 transition-shadow duration-300" style={{
            padding: "5px 10px",
            backgroundColor: stress ? "#0070f3" : "#ffffff",
            color: stress ? "#fff" : "#0070f3",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: 18,
            userSelect: "none",
            margin: "0 5px",
            border: stress ? "none" : "1px solid #0070f3",
        }}>
            {children}
        </div>
    )
}
export { BigButton, SmallButton };