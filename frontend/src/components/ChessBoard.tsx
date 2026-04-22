import { Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../messages";



export const ChessBoard = ({chess, board, socket, setBoard } : {
    setBoard: any;
    chess: any;
    board : ({
            square: Square;
            type: PieceSymbol;
            color: Color;
        } | null) [][];
    socket : WebSocket;
}) => {

    const [from, setFrom] = useState<Square | null>(null);
    const [to, setTo] = useState<Square | null>(null);


    // const move = (from: Square, to: Square) => {
    //     if(!from){
    //         setFrom(square?.square ?? null);
    //     }
    //     else{
    //         setTo(square?.square ?? null);
    //         socket.send(JSON.stringify({
    //             type: MOVE, 
    //             payload: {
    //                 from, 
    //                 to
    //             }
    //         }))
    //     }
    // }




    return <div className="text-black text-2xl ">
        {board.map((row, i) => {
            return <div key={i} className="flex">
                {row.map((square, j) => {
                    const squareRepresentation = String.fromCharCode(97 + j) + (8 - i) as Square;
                    return <div onClick={() => {

                        if(!from){
                            setFrom(squareRepresentation);
                        }
                        else{
                            // setTo(square?.square ?? null);
                            socket.send(JSON.stringify({
                                type: MOVE, 
                                payload: {
                                    move:{
                                        from, 
                                        to: squareRepresentation
                                    }
                                }
                            }))
                            setFrom(null)
                            chess.move({
                                from, 
                                to: squareRepresentation
                            });
                            setBoard(chess.board());
                            console.log({
                                from,
                                to: squareRepresentation
                            })
                        }
                    }} key={j} className={`w-16 h-16 ${(i + j) % 2 == 0 ? 'bg-green-600' : 'bg-orange-100'}`}>
                        <div className="w-full h-full flex justify-center">
                            <div className="h-full flex justify-center flex-col">
                                {square ? <img className="w-14 h-14" src={`/${square?.color === "b" ? `b${square?.type}` : `w${square?.type}`}.png`} /> : null}
                            </div>
                        </div>
                    </div>
                })}
            </div>
        })}
    </div>
}
