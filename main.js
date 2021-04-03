/* -------------------------------------------------------------------------- */
/*                                 Tool Menus                                 */
/* -------------------------------------------------------------------------- */

api("createExtensionMenu", [
	{
		text: "Tools",
		fordoctype: "sch,schlib,pcb",
		submenu: [
			{ text: "Change Font", cmd: "extension-tools-change-font-dialog" },
			{ text: "Rename Module", cmd: "extension-tools-rename-mod-dialog" },
			{ text: "Replace Net Names", cmd: "extension-tools-replace-net-names-dialog" },
			{ text: "Replace Track and Via Names", cmd: "extension-tools-replace-track-names-dialog" },
		],
	},
]);

api("createToolbarButton", {
	title: "Tools",
	fordoctype: "sch,schlib,pcb",
	menu: [
		{ text: "Change Font", cmd: "extension-tools-change-font-dialog" },
		{ text: "Rename Module", cmd: "extension-tools-rename-mod-dialog" },
		{ text: "Replace Net Names", cmd: "extension-tools-replace-net-names-dialog" },
		{ text: "Replace Track and Via Names", cmd: "extension-tools-replace-track-names-dialog" },
	],
});

/* -------------------------------------------------------------------------- */
/*                                  Commands                                  */
/* -------------------------------------------------------------------------- */

api("createCommand", {
	"extension-tools-change-font-dialog": function () {
		changeFontDialog.dialog("open");
	},
	"extension-tools-rename-mod-dialog": function () {
		renameModDialog.dialog("open");
	},
	"extension-tools-rename-mod": function () {
		let prefix = $("#rename-mod-prefix").val();
		let source = api("getSource", { type: "json" });
		// Validation
		let letters = /^[A-Za-z]+$/;
		if (!prefix.match(letters) || prefix.length > 5 || prefix.length < 1) {
			alert("Invalid Prefix (max 5 characters).");
			return;
		}

		// Part Prefix Update
		// if ("schlib" in source) {
		// 	let { schlib } = source;
		// 	for (item in schlib) {
		// 		if ("annotation" in schlib[item]) {
		// 			let { annotation } = schlib[item];
		// 			for (annotation_item in annotation) {
		// 				if ("mark" in annotation[annotation_item]) {
		// 					let { mark } = annotation[annotation_item];
		// 					if (mark == "P") {
		// 						annotation[annotation_item].string = prefix + annotation[annotation_item].string;
		// 					}
		// 				}
		// 			}
		// 		}
		// 	}
		// }

		if ("netflag" in source) {
			let { netflag } = source;
			for (item in netflag) {
				if ("mark" in netflag[item]) {
					let { mark } = netflag[item];
					if (!mark.netFlagString.endsWith("_G")) {
						mark.netFlagString = prefix + "_" + mark.netFlagString;
					}
				}
			}
		}

		if ("netlabel" in source) {
			let { netlabel } = source;
			for (item in netlabel) {
				if (!netlabel[item].name.endsWith("_G")) {
					netlabel[item].name = prefix + "_" + netlabel[item].name;
				}
			}
		}

		api("applySource", { source: source, createNew: false });

		console.log(`Created module with prefix ${prefix}.`);
	},
	"extension-tools-replace-net-names-dialog": function () {
		replaceNetNamesDialog.dialog("open");
	},
	"extension-tools-replace-net-names": function () {
		let find = $("#rename-net-find").val();
		let replace = $("#rename-net-replace").val();
		let source = api("getSource", { type: "json" });

		if ("netflag" in source) {
			let { netflag } = source;
			for (item in netflag) {
				if ("mark" in netflag[item]) {
					let { mark } = netflag[item];
					if (mark.netFlagString == find) {
						mark.netFlagString = replace;
					}
				}
			}
		}

		if ("netlabel" in source) {
			let { netlabel } = source;
			for (item in netlabel) {
				if (netlabel[item].name == find) {
					netlabel[item].name = replace;
				}
			}
		}

		api("applySource", { source: source, createNew: false });

		console.log(`Replaced nets ${find} with ${replace}.`);
	},
	"extension-tools-replace-track-names-dialog": function () {
		replaceTrackNamesDialog.dialog("open");
	},
	"extension-tools-replace-track-names": function () {
		let find = $("#rename-track-find").val();
		let replace = $("#rename-track-replace").val();
		let source = api("getSource", { type: "json" });

		if ("TRACK" in source) {
			let { TRACK } = source;
			for (item in TRACK) {
				if ("net" in TRACK[item]) {
					if (TRACK[item].net == find) {
						TRACK[item].net = replace;
					}
				}
			}
		}

		if ("VIA" in source) {
			let { VIA } = source;
			for (item in VIA) {
				if ("net" in VIA[item]) {
					if (VIA[item].net == find) {
						VIA[item].net = replace;
					}
				}
			}
		}

		api("applySource", { source: source, createNew: false });

		console.log(`Replaced nets ${find} with ${replace}.`);
	},
});

/* -------------------------------------------------------------------------- */
/*                                Font Changing                               */
/* -------------------------------------------------------------------------- */

const FONTS = ["Times New Roman", "helvetica", "sans-serif", "monospace", "Tahoma", "Courier New", "MS Gothic", "Arial", "Arial Black", "Arial Narrow", "Verdana"];

const font_html = FONTS.reduce((prev, curr) => {
	return prev + `<div><a href="#">${curr}</a></div>`;
}, "");

const changeFontDialog = api("createDialog", {
	title: "Change Fonts",
	content: '<div id="tools-change-font-items" style="padding:10px;"></div>' + '<div id="tools-change-font-preset" style="padding:0 10px 10px;">' + font_html + "</div>",
	width: 280,
	height: 400,
	modal: true,
	buttons: [
		{
			text: "Cancel",
			cmd: "dialog-close",
		},
	],
});

!(function () {
	$("#tools-change-font-preset a")
		.linkbutton()
		.on("click", function (e) {
			let font = $(this).text();

			let result = JSON.stringify(api("getSource", { type: "json" }));

			result = result.replace(/"fontFamily":".*?"/g, `"fontFamily":"${font}"`);

			api("applySource", { source: JSON.parse(result), createNew: false });

			console.log(`Changed fonts to ${font}.`);
		});
})();

/* -------------------------------------------------------------------------- */
/*                               Module Renaming                              */
/* -------------------------------------------------------------------------- */

const renameModDialog = api("createDialog", {
	title: "Rename Module",
	content:
		'<div style="padding:10px;"></div>' +
		'<div style="padding:0 10px 10px;">' +
		"<p>Note: Parts that ends with '_G' are global and will not be renamed.</p>" +
		"<br>" +
		"<p>Prefix is used to match PCB module (max 5 characters)</p>" +
		'<label for="rename-mod-prefix">Prefix: </label>' +
		'<input type="text" id="rename-mod-prefix" name="prefix" value="">' +
		"</div>",
	width: 280,
	height: 400,
	modal: true,
	buttons: [
		{
			text: "Apply",
			cmd: "extension-tools-rename-mod;dialog-close",
		},
		{
			text: "Cancel",
			cmd: "dialog-close",
		},
	],
});

/* -------------------------------------------------------------------------- */
/*                              Net Replace Name                              */
/* -------------------------------------------------------------------------- */

const replaceNetNamesDialog = api("createDialog", {
	title: "Rename Net Names",
	content:
		'<div style="padding:10px;"></div>' +
		'<div style="padding:0 10px 10px;">' +
		'<label for="rename-net-find">Find: </label>' +
		'<input type="text" id="rename-net-find" name="find" value="">' +
		"<br>" +
		'<label for="rename-net-replace">Replace With: </label>' +
		'<input type="text" id="rename-net-replace" name="replace" value="">' +
		"</div>",
	width: 280,
	height: 400,
	modal: true,
	buttons: [
		{
			text: "Apply",
			cmd: "extension-tools-replace-net-names;dialog-close",
		},
		{
			text: "Cancel",
			cmd: "dialog-close",
		},
	],
});

/* -------------------------------------------------------------------------- */
/*                             Track Replace Name                             */
/* -------------------------------------------------------------------------- */

const replaceTrackNamesDialog = api("createDialog", {
	title: "Rename Track Names",
	content:
		'<div style="padding:10px;"></div>' +
		'<div style="padding:0 10px 10px;">' +
		'<label for="rename-track-find">Find: </label>' +
		'<input type="text" id="rename-track-find" name="find" value="">' +
		"<br>" +
		'<label for="rename-track-replace">Replace With: </label>' +
		'<input type="text" id="rename-track-replace" name="replace" value="">' +
		"</div>",
	width: 280,
	height: 400,
	modal: true,
	buttons: [
		{
			text: "Apply",
			cmd: "extension-tools-replace-track-names;dialog-close",
		},
		{
			text: "Cancel",
			cmd: "dialog-close",
		},
	],
});
