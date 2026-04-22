import { Link } from "react-router-dom";

const Footer = () => {
	const year = new Date().getFullYear();

	return (
		<footer className="relative overflow-hidden bg-[#050505] text-zinc-200">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(161,161,170,0.12),transparent_34%),radial-gradient(circle_at_85%_78%,rgba(113,113,122,0.1),transparent_38%)]" />

			<div className="relative border-t border-zinc-700/60">
				<div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-3 md:px-10 lg:px-14">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.38em] text-zinc-400">
							Circle To Square
						</p>
						<h3 className="mt-4 font-['Bebas_Neue',sans-serif] text-4xl leading-none tracking-[0.1em] text-zinc-100">
							PLAY CHESS ONLINE
						</h3>
						<p className="mt-4 max-w-sm font-['Playfair_Display',serif] text-sm leading-relaxed text-zinc-400">
							Challenge players, sharpen strategy, and enjoy a premium chess
							experience built for speed and focus.
						</p>
					</div>

					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-300">
							Quick Links
						</p>
						<ul className="mt-4 space-y-3 text-sm text-zinc-400">
							<li>
								<Link className="transition hover:text-zinc-100" to="/">
									Home
								</Link>
							</li>
							<li>
								<Link className="transition hover:text-zinc-100" to="/game">
									Play Game
								</Link>
							</li>
							<li>
								<a className="transition hover:text-zinc-100" href="#">
									About
								</a>
							</li>
						</ul>
					</div>

					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-300">
							Contact
						</p>
						<ul className="mt-4 space-y-3 text-sm text-zinc-400">
							<li>support@circletosquare.app</li>
							<li>Available 24/7 for match support</li>
							<li className="text-zinc-500">Built with React + TypeScript</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-zinc-800/80 px-6 py-5 md:px-10 lg:px-14">
					<div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center">
						<p>Copyright {year} Circle To Square. All rights reserved.</p>
						<p>Designed for modern competitive chess.</p>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
