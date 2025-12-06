// Declare external npm plugin modules
declare module 'vue-grid-layout';
declare module 'qrcodejs2-fixes';
declare module 'splitpanes';
declare module 'js-cookie';
declare module '@wangeditor/editor-for-vue';
declare module 'js-table2excel';
declare module 'qs';
declare module 'sortablejs';

// Declare a module to prevent errors when importing files
declare module '*.json';
declare module '*.png';
declare module '*.jpg';
declare module '*.scss';
declare module '*.ts';
declare module '*.js';

// Declaration files, files with *.vue suffix are handed over to the vue module for processing
declare module '*.vue' {
	import type { DefineComponent } from 'vue';
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

// Declaration file, define global variables
/* eslint-disable */
declare interface Window {
	nextLoading: boolean;
	BMAP_SATELLITE_MAP: any;
	BMap: any;
}

// Declare the current item type of the route
declare type RouteItem<T = any> = {
	path: string;
	name?: string | symbol | undefined | null;
	redirect?: string;
	k?: T;
	meta?: {
		title?: string;
		isLink?: string;
		isHide?: boolean;
		isKeepAlive?: boolean;
		isAffix?: boolean;
		isIframe?: boolean;
		roles?: string[];
		icon?: string;
		isDynamic?: boolean;
		isDynamicPath?: string;
		isIframeOpen?: string;
		loading?: boolean;
	};
	children: T[];
	query?: { [key: string]: T };
	params?: { [key: string]: T };
	contextMenuClickId?: string | number;
	commonUrl?: string;
	isFnClick?: boolean;
	url?: string;
	transUrl?: string;
	title?: string;
	id?: string | number;
};

// Declare route to from
declare interface RouteToFrom<T = any> extends RouteItem {
	path?: string;
	children?: T[];
}

// Declare route current item type collection
declare type RouteItems<T extends RouteItem = any> = T[];

// statement ref
declare type RefType<T = any> = T | null;

// statement HTMLElement
declare type HtmlType = HTMLElement | string | undefined | null;

// statement children 
declare type ChilType<T = any> = {
	children?: T[];
};

// statement Optional
declare type EmptyArrayType<T = any> = T[];

// statement object
declare type EmptyObjectType<T = any> = {
	[key: string]: T;
};

// statement select option
declare type SelectOptionType = {
	value: string | number;
	label: string | number;
};

// Mouse wheel scroll type
declare interface WheelEventType extends WheelEvent {
	wheelDelta: number;
}

// table Data format public type
declare interface TableType<T = any> {
	total: number;
	loading: boolean;
	param: {
		pageNum: number;
		pageSize: number;
		[key: string]: T;
	};
}
