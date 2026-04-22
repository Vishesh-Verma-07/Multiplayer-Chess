import { useEffect, useState } from "react";
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { useSocket } from "../hooks/useSocket"
import { GAME_OVER, INIT_GAME, MOVE } from "../messages";
import { Chess } from "chess.js";

export const Game = () => {

    console.log("createing the socket")
    const socket = useSocket();
    console.log("socket created")

    const [chess, setChess] = useState(new Chess())
    const [Board, setBoard] =  useState(chess.board());
    // const [color, setColor] = useState<string | null>();

    useEffect(() => {
        if(!socket)
            return;

        socket.onmessage = (event) => {
            const messages = JSON.parse(event.data);
            console.log(messages);
            // setColor(messages.paylooad.color);

            switch(messages.type){
                case INIT_GAME:
                    // setChess(new Chess());
                    setBoard(chess.board());
                    console.log("Game initialiesed");
                    break;
                case MOVE:
                    const move = messages.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    console.log("move made");
                    break;
                case GAME_OVER:
                    console.log("Game Over");
                    break;
            }
        }
    }, [socket]);

    if(!socket)
        return <div>Connecting... </div>

    return <div className="flex justify-center">
        <div className="pt-8 max-w-screen-lg w-full border">

            <div className="grid grid-cols-6 gap-16 border ">
                <div className=" col-span-4 flex justify-center">
                    <ChessBoard setBoard={setBoard} chess={chess} socket = {socket} board = {Board} />
                </div>
                <div className="col-span-2 my-auto">
                    <Button text = {"play"} onClick={() => {
                        socket.send(JSON.stringify({
                            type: INIT_GAME,
                        }))
                    }} />

                    {/* {color && (
                        <div className="mt-4 p-2 px-8 w-fit bg-red-200 rounded shadow-md text-center">
                            <span className="text-lg font-semibold">Playing as: </span>
                            <span className={`text-lg font-bold ${color === 'white' ? 'text-gray-800' : 'text-black'}`}>
                                {color.charAt(0).toUpperCase() + color.slice(1)}
                            </span>
                        </div>
                    )} */}
                    
                   
                    
                </div>
            </div>
        </div>

    </div>
}