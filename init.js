/** 左侧下拉菜单控制 **/

$(".leftsidebar_box dt img").attr("src", "/helmets/static/helmets/images/left/select_xl01.png");
$(function () {
    $(".leftsidebar_box dd").hide(); //隐藏
    /**系统默认显示第一行菜单**/
    $(".first_dt").parent().find('dd').show(); // 默认显示第一行菜单
	$(".data").parent().find('dd').show(); // 默认显示第一行菜单
    $(".first_dt img").attr("src", "/helmets/static/helmets/images/left/select_xl.png"); //当前焦点一级菜单项图标
    $(".first_dt").css({ "background-color": "#1f6b75" }); // 焦点一级菜单项的样式
    /**一级菜单项单击事件**/
    $(".leftsidebar_box dt").click(function () {
        //判断当前一级菜单下的二级菜单项是否隐藏
        if ($(this).parent().find('dd').is(":hidden")) {
            $(this).parent().find('dd').slideToggle(); //滑动方式展开子菜单
            $(this).css({ "background-color": "#1f6b75" }); //焦点一级菜单项背景颜色             
            $(this).parent().find('img').attr("src", "/helmets/static/helmets/images/left/select_xl.png"); //当前焦点一级菜单项图标
        }
        else {
            $(this).parent().find('dd').slideUp(); //滑动方式隐藏子菜单
            $(this).css({ "background-color": "#339999" }); //非焦点一级菜单项背景颜色
            $(this).parent().find('img').attr("src", "/helmets/static/helmets/images/left/select_xl01.png"); //非焦点一级菜单项图标
        }
    });


    //            $(".leftsidebar_box dt").click(function () {
    //                $(".leftsidebar_box dd").hide(); //隐藏
    //                $(".leftsidebar_box dt").css({ "background-color": "#339999" }); //非焦点一级菜单项背景颜色
    //                $(this).css({ "background-color": "#1f6b75" }); //焦点一级菜单项背景颜色             
    //                $(".leftsidebar_box dt img").attr("src", "images/left/select_xl01.png"); //非焦点一级菜单项图标
    //                $(this).parent().find('img').attr("src", "images/left/select_xl.png"); //当前焦点一级菜单项图标
    //                $(this).parent().find('dd').slideToggle(); //当前二级菜单滑动展开显示
    //                //$(this).parent().find('dd').removeClass("menu_choice");//移除当前二级菜单项的选中样式
    //                //$(".menu_choice").slideUp();//滑动方式隐藏
    //                //$(this).parent().find('dd').addClass("menu_choice");//为焦点一级菜单下选中二级菜单项设置选中样式
    //            });   

    /**二级菜单项单击事件**/
    $(".leftsidebar_box dd").click(function () {
        $(".leftsidebar_box dd").css({ "background-color": "#4c4e5a", "color": "#f5f5f5" }); //二级菜单项背景颜色
        $(this).css({ "background-color": "#38393F", "color": "#a9a9a9" }); //选中项二级菜单项背景颜色
    });

    //            /**二级菜单项鼠标悬停事件**/
    //            $(".leftsidebar_box dd").hover(function () {
    //                $(this).css({ "background-color": "#38393F", "color":"#a9a9a9"});
    //            }, function () {
    //                $(this).css({ "background-color": "#4c4e5a", "color": "#f5f5f5" });
    //            });

})

/** 源码控制 **/
/*
$(function () {
    //源码域显示/隐藏控制
    var iCodeWidth = 360,
	        oArrow = $('#code_arrow'),
	        oCodeCore = $('#leftbox'),
            oIframeWrapper = $('div.iframe_wrapper'),
	        iIframeMargin = parseInt(oIframeWrapper.css('margin-left'));
    oArrow.click(function () {
        if (oArrow.hasClass('go_back')) {
            oCodeCore.animate({ width: 0 });
            oIframeWrapper.animate({ marginLeft: iIframeMargin - iCodeWidth });
            oArrow.removeClass('go_back');
        } else {
            oCodeCore.animate({ width: iCodeWidth });
            oIframeWrapper.animate({ marginLeft: iIframeMargin });
            oArrow.addClass('go_back');
        }
    });
})*/