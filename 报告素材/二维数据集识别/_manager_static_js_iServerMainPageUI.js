 /*iServer首页菜单栏二级下拉菜单显示Begin*/
// $(document).ready(function(){
	 //设置子菜单div的宽度,思路：判断中英文界面，进行不同的宽度设置，问题：如何进行中英文条件获取

//	 $(".sample").mouseover(function(){
//		 var userLanguae=window.navigator.browserLanguage;
//		 if(userLanguae.indexOf('zh')>-1){
//
//			 alert("Yse");
//		 }else{
//			 alert("No");
//		 }
//		 var sampleWidth=$(".sample").width();
//         $(".hidden-box").css("width",sampleWidth*2);
//     });
//   nav-li hover e
//   var num = 3;
//   $('.nav-main>li[id]').hover(function(){
//      /*图标向上旋转*/
////       $(this).children().addClass('hover-up');
//       /*下拉框出现*/
//       var Obj = $(this).attr('id');
//       num = Obj.substring(3, Obj.length);
//       $('#box-'+num).slideDown(300);
//   },function(){
//       /*图标向下旋转*/
////       $(this).children().addClass('hover-down');
//       /*下拉框消失*/
//       $('#box-'+num).hide();
//   });
//   hidden-box hover e
//   $('.hidden-box').hover(function(){
//       /*保持图标向上*/
//       $('#li-'+num).children().addClass('hover-up');
//       $(this).show();
//   },function(){
//       //$(this).slideUp(20000);
//       $('#li-'+num).children().addClass('hover-down');
//   });
//});
 /*iServer首页菜单栏二级下拉菜单背景色显示End*/
 /*iServer首页菜单栏调整1024屏幕下logo大小Begin*/
$(document).ready(function(){
	$(".subHeadMenu .btn-group").hover(
		function(){
			$(this).addClass('open');
			$(".subHeadMenu .btn-group .closesvg").hide();
			$(".subHeadMenu .btn-group .opensvg").show();
		},
		function(){
			$(this).removeClass('open');
			$(".subHeadMenu .closesvg").show();
			$(".subHeadMenu .opensvg").hide();
		}
	)
	$("#language").hover(
		function(){
			$(this).addClass('open');
			$("#language .closesvg").hide();
			$("#language .opensvg").show();
		},
		function(){
			$(this).removeClass('open');
			$("#language .closesvg").show();
			$("#language .opensvg").hide();
		}
	)

	$(".subHeadMenu .btn-group").on('show.bs.dropdown',function(){
		$(".subHeadMenu .btn-group .closesvg").hide();
		$(".subHeadMenu .btn-group .opensvg").show();
	})
	$(".subHeadMenu .btn-group").on('hide.bs.dropdown',function(){
		$(".subHeadMenu .btn-group .closesvg").show();
		$(".subHeadMenu .btn-group .opensvg").hide();
	})
	$("#language").on('show.bs.dropdown',function(){
		$("#language .closesvg").hide();
		$("#language .opensvg").show();
	})
	$("#language").on('hide.bs.dropdown',function(){
		$("#language .closesvg").show();
		$("#language .opensvg").hide();
	})
	$(".sidemenu").on('show.bs.dropdown',function(){
		$(".sidemenu .closesvg").hide();
		$(".sidemenu .opensvg").show();
	})
	$(".sidemenu").on('hide.bs.dropdown',function(){
		$(".sidemenu .closesvg").show();
		$(".sidemenu .opensvg").hide();
	})

	 pareWidth(function(){
		 var menuWidth=$("#headMenu").width();
		 if(menuWidth<1025){
			 $(".headlogo").css("width","163px");
			 $(".headlogo").css("height","38px");
			 //document.getElementById("#earthPic").src="${resource.rootPath}/../manager/static/css/iserver/images/1024earth.png";
			 $(".earthPic").attr("src","${resource.rootPath}/../manager/static/css/iserver/images/1024earth.png");
		 }else{
			 $(".headlogo").css("width","190px");
			 $(".headlogo").css("height","45px");
			 $(".earthPic").attr("src","${resource.rootPath}/../manager/static/css/iserver/images/1920earth.png");
		 }
     });

	$("#theme").hover(
		function(){
			$(this).addClass('open');
			$("#theme .closesvg").hide();
			$("#theme .opensvg").show();
		},
		function(){
			$(this).removeClass('open');
			$("#theme .closesvg").show();
			$("#theme .opensvg").hide();
		}
	)
	$("#theme").on('show.bs.dropdown',function(){
		$("#theme .closesvg").hide();
		$("#theme .opensvg").show();
	})
	$("#theme").on('hide.bs.dropdown',function(){
		$("#theme .closesvg").show();
		$("#theme .opensvg").hide();
	})

 });

 /*iServer首页菜单栏调整1024屏幕下logo大小End*/
 function pareWidth(obj){
	 var menuWidth=$("#headMenu").width();
	 if(menuWidth<1025){
		 $(".headlogo").css("width","163px");
		 $(".headlogo").css("height","38px");
//		 document.getElementById("#earthPic").src="${resource.rootPath}/../manager/static/css/iserver/images/1024earth.png";
//		 $(".earthPic").attr("src","${resource.rootPath}/../manager/static/css/iserver/images/1024earth.png");
	 }else{
		 $(".headlogo").css("width","190px");
		 $(".headlogo").css("height","45px");
//		 document.getElementById("#earthPic").src="${resource.rootPath}/../manager/static/css/iserver/images/1920earth.png";
//		 $(".earthPic").attr("src","${resource.rootPath}/../manager/static/css/iserver/images/1920earth.png");
	 }
 }


