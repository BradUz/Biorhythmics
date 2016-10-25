var avirgin = true;

function chrome_save()
{
	chrome.storage.local.set({"memory": H.storage.save_memory2(H.machine)});
	console.log("Memory saved");
}

Hp12c_storage.prototype.save = function () {
	chrome_save();
}

chrome.app.window.current().onClosed.addListener(function () {
	chrome_save();
});

Hp12c_storage.prototype.load = function() {
	var sserial;
	chrome.storage.local.get("memory", function (contents) {
		var sserial = "" + contents["memory"];
		H.storage.recover_memory2(H.machine, sserial);
		H.machine.display_result_s();
		console.log("Memory loaded " + sserial.substr(0, 50) + "...");
	});
	avirgin = false;
};

var show_save_handle = 0;

var old_show = Hp12c_display.prototype.private_show;

Hp12c_display.prototype.private_show = function (s)
{
	old_show.call(H.display, s);
	if (!avirgin) {
		if (show_save_handle) {
			window.clearTimeout(show_save_handle);
		}
		show_save_handle = window.setTimeout(function () {
			H.storage.save();
			show_save_handle = 0;
		}, 1000);
	}
}

Init_hp12c();
