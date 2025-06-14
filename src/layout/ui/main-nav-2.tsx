import * as React from "react"
import { NavigationMenu } from "radix-ui"
import classNames from "classnames"
import { CaretDownIcon } from "@radix-ui/react-icons"
// import "./styles.css" // handled by src\layout\styles\styles-radix-ui-custom.css

const NavigationMenuDemo = () => {
	return (
		<NavigationMenu.Root className="NavigationMenuRoot">
			<NavigationMenu.List className="NavigationMenuList">
				<NavigationMenu.Item>
					<NavigationMenu.Trigger className="NavigationMenuTrigger">
						Demos <CaretDownIcon className="CaretDown" aria-hidden />
					</NavigationMenu.Trigger>
					<NavigationMenu.Content className="NavigationMenuContent">
						<ul className="List one">
							<li style={{ gridRow: "span 3" }}>
								<NavigationMenu.Link asChild>
									<a className="Callout" href="/#callout">
										<svg
											aria-hidden
											width="38"
											height="38"
											viewBox="0 0 25 25"
											fill="white"
										>
											<path d="M12 25C7.58173 25 4 21.4183 4 17C4 12.5817 7.58173 9 12 9V25Z"></path>
											<path d="M12 0H4V8H12V0Z"></path>
											<path d="M17 8C19.2091 8 21 6.20914 21 4C21 1.79086 19.2091 0 17 0C14.7909 0 13 1.79086 13 4C13 6.20914 14.7909 8 17 8Z"></path>
										</svg>
										<div className="CalloutHeading">ThreeD Garden</div>
										<p className="CalloutText">
											3D Modeling App using React, React-Three, and GraphQL.
										</p>
									</a>
								</NavigationMenu.Link>
							</li>

							<ListItem 
								href="/home-design" 
								title="FULL"
							>
								See the full capacity 3D + 2D demo, with best-in-class developer experience.
							</ListItem>
							<ListItem 
								href="/participate" 
								title="BASIC"
							>
								For a basic demo, check out the 3D canvas-only version.
							</ListItem>
							<ListItem 
								href="/demo" 
								title="LEGACY"
							>
								Review the legacy app that we've previously supported, which is written in vanilla JavaScript and Three.JS.
							</ListItem>
						</ul>
					</NavigationMenu.Content>
				</NavigationMenu.Item>

				<NavigationMenu.Item>
					<NavigationMenu.Trigger className="NavigationMenuTrigger">
						Chats <CaretDownIcon className="CaretDown" aria-hidden />
					</NavigationMenu.Trigger>
					<NavigationMenu.Content className="NavigationMenuContent">
						<ul className="List two">
							<ListItem
								title="Chat: OpenAI"
								href="/chat/openai"
							>
								Build high-quality, accessible design systems and web apps.
							</ListItem>
							<ListItem
								title="Chat: DeepSeek"
								href="/chat/deepseek"
							>
								A quick tutorial to get you up and running with Radix
								Primitives.
							</ListItem>
							<ListItem 
								title="Resources: 1" 
								href="/#resources-1"
							>
								Unstyled and compatible with any styling solution.
							</ListItem>
							<ListItem
								title="Resources: 2"
								href="/#resources-2"
							>
								Use CSS keyframes or any animation library of your choice.
							</ListItem>
							<ListItem
								title="Resources: 3"
								href="#resources-3"
							>
								Tested in a range of browsers and assistive technologies.
							</ListItem>
							<ListItem
								title="Resources: 4"
								href="#resources-4"
							>
								Radix Primitives releases and their changelogs.
							</ListItem>
						</ul>
					</NavigationMenu.Content>
				</NavigationMenu.Item>

				<NavigationMenu.Item>
					<NavigationMenu.Link
						className="NavigationMenuLink"
						href="https://github.com/marty-mcgee/threed-garden/"
					>
						Github
					</NavigationMenu.Link>
				</NavigationMenu.Item>

				<NavigationMenu.Indicator className="NavigationMenuIndicator">
					<div className="Arrow" />
				</NavigationMenu.Indicator>
			</NavigationMenu.List>

			<div className="ViewportPosition">
				<NavigationMenu.Viewport className="NavigationMenuViewport" />
			</div>
		</NavigationMenu.Root>
	)
}

interface ListItemProps {
	className?: string;
	children: React.ReactNode;
	title: string;
	href: string;
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
	({ className, children, title, href, ...props }, forwardedRef) => (
		<li>
			<NavigationMenu.Link asChild>
				<a
					className={classNames("ListItemLink", className)}
					href={href}
					{...props}
					ref={forwardedRef}
				>
					<div className="ListItemHeading">{title}</div>
					<p className="ListItemText">{children}</p>
				</a>
			</NavigationMenu.Link>
		</li>
	),
)

export default NavigationMenuDemo
