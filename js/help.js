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
function showFilters() {
	$("#clusters").css('opacity',1);
	$("#clusters").css('z-index',28);
}
function hideFilters() {
	$("#clusters").css('opacity',0);
	$("#clusters").css('z-index',-30);
}
