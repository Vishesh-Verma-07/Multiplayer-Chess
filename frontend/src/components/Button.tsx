
export const Button = ({text, onClick}: {text: string, onClick: () => void}) => {
    return <div>
         <button onClick={onClick} className="py-4 px-8 bg-green-500 hover:bg-green-700 text-2xl text-white font-bold rounded ">
            {text}
        </button>
    </div>
}