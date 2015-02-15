function showHelp() {
	$("#helpBox").fadeIn();
}
function hideHelp() {
	$("#helpBox").fadeOut();
}
function showMiniHelp(id) {
	$("#miniHelpFrame").attr('src','about/'+id+'.html');
	$("#miniHelp").fadeIn();
}
function hideMiniHelp() {
	$("#miniHelp").fadeOut();
}
