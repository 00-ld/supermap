// JavaScript Document
var stepNumber = 1;
var firstStepIntroHTML = "<label class='stepTitle'>"+quickCreateInstanceRes.firstStepTitle+"</label><br/><br/><p class='stepDes'>"+quickCreateInstanceRes.firstStepDes+"</p>";
var secondStepIntroHTML = "<label class='stepTitle'>"+quickCreateInstanceRes.secondStepTitle+"</label><br/><br/>"; // <p
var sixthStepIntroHTML = "<label class='stepTitle'>"+quickCreateInstanceRes.sixthStepTitle+"：</label><br/><br/>";
var guide ;
var rootUrl;
$(document).ready(function() {
	// 对话框的初始化
	$('#publishService').dialog({
				title : quickCreateInstanceRes.publishServiceDialog,
				autoOpen : false,
				modal : true,
				minHeight : 200,
				minWidth : 500,
				//position : [250,100],
				maxHeight:600,
				resizable : false,
				open: function(event, ui) {
//					$('select').hide();
					keyDown.enabled=true;
					guide = new QuickGuide();
					$('select').filter(".publishService").show();
				},
					close: function(event, ui)  {
						keyDown.enabled=false;
					$('select').show();
					$('select').filter(".publishService").hide();
					//如果name属性指定为refresh,则刷新页面

					var objName=$('.publishServiceLink').attr('name');
					if(objName !=null && objName == "refresh"){
						if($("#newInstance").css("display") != "none"){
							window.location.reload();
						}
					}
				}
			});
	rootUrl = getRootUrl();
	// Dialog Link
	$('.publishServiceLink').click(function() {
				PublishGuide.initGlobalVariable();
				PublishGuide.showChoseDatasourceTypeDialog();
				$('#publishService').dialog('open');
				$('#publishService').dialog("option","position",[250,100]);
				$("#publishService #errorMsg").hide();
				return false;
			});

	// 当点击下一步按钮后的事件处理
	$("#dialogNext").click(function() {
		guide.next();
	});

	// 当点击上一步按钮后的事件处理
	$("#dialogPrev").click(function() {
		guide.prev();
	});

	// 点击对话框完成，创建Provider，ProviderSet,Component,更新页面显示
	$('#publishService #dialogFinish').click(function() {
		$("#waiting").show();
		var isSucceed = false;
		//修改发布服务的方式,工作空间类型的使用向workspaces发post请求的方式来发布
		var ifPostWorkspaces = (datasourceType==DatasourceType.WORKSPACE || datasourceType==DatasourceType.WORKSPACE_FILE);
		if(ifPostWorkspaces){
			var publishResult = publishServicePostWorkspaces();
			isSucceed = typeof publishResult.succeed == 'undefined'&&publishResult.succeed!=false;
		}else if(datasourceType==DatasourceType.DataStoreData){
			var publishResult = publishServicePostDataStoreData();
			isSucceed = typeof publishResult.succeed == 'undefined'&&publishResult.succeed!=false;
		}else if(datasourceType==DatasourceType.DataFlowService){
			var publishResult = publishDataFlowService();
			isSucceed = typeof publishResult.succeed == 'undefined'&&publishResult.succeed!=false;
		}else if(datasourceType==DatasourceType.StreamingService){
			var publishResult = publishStreamingService();
			isSucceed = typeof publishResult.succeed == 'undefined'&&publishResult.succeed!=false;			
		}else if(datasourceType==DatasourceType.ArcGISGeometryService){
			isSucceed = publishArcGeometryService();		
		}else if (datasourceType === DatasourceType.ImageService) {
			isSucceed = publishImageService();
		} else {
			isSucceed = publishServiceFinish();
		}
		if(isSucceed){
			$(".publishServiceStepIntro").html(sixthStepIntroHTML);
			$("#publishService #dialogNext").hide();
			$("#publishService #dialogPrev").hide();
			$("#publishService #dialogFinish").hide();
			$('#publishService #dialogCancel').html(quickCreateInstanceRes.dialogCancelClose);
			$('#publishService #dialogCancel').addClass("btn-primary").removeClass("btn-default");
			$("#instanceResult").hide();
			$("#newInstance").empty();
			var instanceNames = new Array();
			var instanceLinks = new Array();
			// 流数据服务没有服务实例，不能像其他服务那样，超链接指向服务实例，只能把超链接指向服务管理页面
			if(publishResult && DatasourceType.StreamingService === datasourceType ) {
				for(var i = 0; i < publishResult.length; i++){
					if("STREAMING" == publishResult.get(i).serviceType) {
				        var link = publishResult.get(i).serviceAddress;
				        var linkStr = link.split('/');
				        var serviceName = linkStr[linkStr.length - 1];
				        var imgSrc = getRootUrl() + "static/img/running.gif";
						var innerHtml = "<p><img id='streamingStateImg" +i+"' style='padding-right:4px;' src='"+imgSrc+"'/><label id='stateLabel"+i+"' style='display:none;padding-left:0px;width: auto;float:none;'>" + serviceName + "</label><a title='"+ publishServiceRes.tips +"' style='width: auto;' id='newService"+i+"' name='"+link+"'>"+serviceName
			               +"</a></p>";
			            $("#newInstance").append(innerHtml);
			            break;
					}
				}
				if(publishResult.length == 1){
					// 修改a标签属性，使其点击时可以打开一个新的页面，而不是在本页面跳转
					$("#newInstance a").prop("target", "_blank");
					$("#newInstance a").prop("href", $("#newInstance a").prop("name"));
					$("#newInstance a").removeAttr("name");
					$("#waiting").hide();
					$("#newInstance").show();
					return;
				}
				publishResult.splice(i, 1);
			}
		    
			if(DatasourceType.DataFlowService === datasourceType || DatasourceType.StreamingService === datasourceType) {
				constructDataFlowInstanceNameAndLinks(publishResult,instanceNames,instanceLinks);
			} else if(DatasourceType.AddressMathIndex === datasourceType) {
				constructAddressMatchIndexInstanceNameAndLinks(addressMatchIndexComponentEntity, instanceNames, instanceLinks);
			}else if(ifPostWorkspaces||DatasourceType.DataStoreData==datasourceType){
				//构建服务实例名数组和服务链接地址数组。
				constructInstanceNameAndLinks(publishResult,instanceNames,instanceLinks);
			}else if(datasourceType==DatasourceType.ArcGISGeometryService){
				constructArcGISGeometryInstanceNameAndLinks(ArcGISGeometryComponentEntity,instanceNames,instanceLinks);
			}else if (datasourceType === DatasourceType.ImageService) {
				constructImageServiceInstanceNameAndLinks(imageServiceComponentEntity, instanceNames, instanceLinks);
			} else {
				//也是构建服务实例名数组和服务链接地址数组。
				constructInstanceLink(dataComponentEntity,dataHistoryComponentEntity,mapComponentEntity,realspaceComponentEntity,spatialAnalysisComponentEntity,transportationAnalystComponentEntity,instanceNames,instanceLinks,serviceType,trafficTransferAnalystComponentEntity, plotComponentEntity,addressMatchComponentEntity, geoprocessingComponentEntity, mongodbMVTTileComponentEntity);
			}
			appendInstancesToDIV("newInstance", instanceNames, instanceLinks);
			// 控制单击完成对话框中的服务实例链接，打开一个新窗口而不是跳转页面
			$("#newInstance a").click(function(){
				var url = $(this).attr('name');
				window.open(url);
			});
			//服务发布后，需要定时检查服务启动的状态，并根据启动的结果来更新界面。
			var stateCheckManager = new InstanceStateCheckManager(instanceNames);
			stateCheckManager.start();
		} else {
			$("#publishService #waiting").hide();
			if(publishResult != null && publishResult.error != null && publishResult.error.errorMsg !== null) {
				SuperMapServer.Dialog.alert(publishResult.error.errorMsg.substring(publishResult.error.errorMsg.indexOf(":")+1));
			}
		}
	});

	$("#isMultiInstance").click(function(){
		if($('#isMultiInstance').prop("checked")){
			$('#instanceCountDiv').css("display","block");
		}else{
			$('#instanceCountDiv').css("display","none");
		}
	});
	$("#workspaceTypeSel").change(function(){
		var workspaceType = $("#workspaceTypeSel").val();
		if(workspaceType == "fileWorkspace"){
			$('#publishService').dialog("option", "width", 696);
		}else if(workspaceType == "oracleWorkspace"){
			$('#publishService').dialog("option", "width", 510);
		}else if(workspaceType == "sqlWorkspace"){
			$('#publishService').dialog("option", "width", 510);
		}
	});

	$('#publishService #dialogCancel').click(function() {
		guide.cancle();
		cancle(this);
	});

	$('#serverFile').hide();
	$("#local").attr("checked",true);

	$("#local").click(function(){
		if($(this).prop('checked')){
			$('#serverPath').hide();
			$('#localFile').show();
		}else{
			$('#serverPath').show();
			$('#localFile').hide();
		}
	});
});

/**
 * 将新发布的服务实例信息追加到div 中。
 * @param divID
 * @param instanceNames
 * @param instanceAdresses
 */
function appendInstancesToDIV(divID,instanceNames,instanceAdresses){
	var length = instanceNames.length;
	var loadingImgSrc = getRootUrl() + "static/img/loading1.gif";
	for(var i=0;i<length;i++){
		if(i==0){
			var innerHtml = "<p><img id='stateImg" +i+"' style='padding-right:4px;' title='"+ quickCreateInstanceRes.service + instanceNames[i] + quickCreateInstanceRes.starting +"' src='"+loadingImgSrc+"'/><label id='stateLabel"+i+"' style='display:inline;padding-left:0px;width: auto;float:none;'>" + instanceNames[i] + "</label><a title='"+ publishServiceRes.tips +"' style='display:none;width: auto;' id='newInstance"+i+"' name='"+instanceAdresses[i]+"'>"+instanceNames[i]
			               +"</a></p>"
			$("#"+divID).append(innerHtml);
		}else{
			var innerHtml = "<p><img id='stateImg"+i+"' style='padding-right:4px;' title='"+ quickCreateInstanceRes.service + instanceNames[i] + quickCreateInstanceRes.starting +"' src='"+loadingImgSrc+"'/><label id='stateLabel"+i+"' style='display:inline;padding-left:0px;width: auto;float:none;'>" + instanceNames[i] + "</label><a title='"+ publishServiceRes.tips + "' style='display:none;width: auto;' id='newInstance"+i+"' name='"+instanceAdresses[i]+"'>"
			                +instanceNames[i]+"</a></p>";
			$("#"+divID).append(innerHtml);
		}
	}
}


