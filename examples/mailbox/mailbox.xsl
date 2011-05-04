<?xml version="1.0" encoding="utf-8"?>

<!DOCTYPE xsl:stylesheet [
    <!ENTITY static "http://mailstatic.yandex.net/neo2/2.12.0/static">
]>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

<xsl:output encoding="utf-8" method="html" indent="no" omit-xml-declaration="yes"/>

<!-- ############################################################################################################## -->

<xsl:variable name="params" select="/page/page-params"/>
<xsl:variable name="page" select="$params/_page"/>

<xsl:variable name="folders" select="/page/folders/folder"/>
<xsl:variable name="labels" select="/page/labels/label"/>
<!--
<xsl:variable name="settings" select="/page/settings"/>
-->

<xsl:key name="labels" match="/page/labels/label" use="symbol | @id"/>
<!--
<xsl:key name="folders" match="/page/folders/folder" use="symbol | @id"/>
<xsl:key name="settings" match="/page/settings/*" use="name()"/>
-->

<xsl:variable name="label-important" select="key('labels', 'priority_high')"/>
<xsl:variable name="label-important-id" select="$label-important/@id"/>

<!-- ############################################################################################################## -->

<xsl:template match="/">
<html>
<!--
<xsl:if test="key('settings', 'hide_daria_header')">
    <xsl:attribute name="class">b-page_minified</xsl:attribute>
</xsl:if>
-->
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <link rel="stylesheet" type="text/css" href="&static;/css/_mac.css"/>
    <title>Яндекс.Почта</title>
</head>
<body>
    <xsl:apply-templates select="page"/>
</body>
</html>
</xsl:template>

<xsl:template match="page">
    <div class="b-page">
        <div class="b-page__content">
            <xsl:apply-templates select="page-blocks" mode="block"/>
        </div>
    </div>
</xsl:template>

<!-- ############################################################################################################## -->

<xsl:template match="*" mode="block">
    <div class="block-{ name() }">
        <xsl:apply-templates select="." mode="block-content"/>
    </div>
</xsl:template>

<xsl:template match="*" mode="block-content">
    <xsl:apply-templates select="*" mode="block"/>
</xsl:template>

<!-- ############################################################################################################## -->

<xsl:template match="*" mode="href">
    <xsl:attribute name="href">
        <xsl:apply-templates select="." mode="href-content"/>
    </xsl:attribute>
</xsl:template>

<!-- ############################################################################################################## -->

<xsl:template match="app" mode="block-content">
    <img alt="-" title="Компактный вид" action="common.minify" class="b-mail-icon b-mail-icon_minify b-mail-icon_full-head-hide daria-action" src="&static;/blocks/b-mail-icon/_type/b-mail-icon_full-head-hide.png"/>
    <div class="b-layout">
        <div class="b-layout__left">
            <xsl:apply-templates select="left-box" mode="block"/>
        </div>
        <div class="b-layout__right">
            <div class="b-layout__right__content">
                <xsl:apply-templates select="." mode="service-tabs"/>
                <xsl:apply-templates select="." mode="toolbar"/>
                <xsl:apply-templates select="right-box" mode="block"/>
            </div>
        </div>
    </div>
</xsl:template>

<!-- ############################################################################################################## -->

<!-- tabs -->

<xsl:template match="app" mode="service-tabs">
    <div class="b-service-tabs">
        <a href="#inbox" class="b-service-tabs__item b-service-tabs__item_current b-service-tabs__item_mail">Письма</a>
        <a href="#contacts" class="b-service-tabs__item b-service-tabs__item_contacts">Контакты</a>
        <a href="#lenta" class="b-service-tabs__item b-service-tabs__item_lenta">Подписки<span class="b-mail-counter">682</span></a>
        <a class="b-service-tabs__item" href="//calendar.yandex.ru/">Календарь</a>
    </div>
</xsl:template>

<!-- ############################################################################################################## -->

<!-- toolbar -->

<xsl:template match="app" mode="toolbar">
    <div class="b-toolbar">
        <div class="b-toolbar__i">
            <div class="b-toolbar__block b-toolbar__block_right">
                <xsl:apply-templates select="search" mode="block"/>
                <div class="b-toolbar-dropdowns">
                    <xsl:apply-templates select="labels-actions" mode="block"/>
                    <xsl:apply-templates select="folders-actions" mode="block"/>
                </div>
            </div>
            <div class="b-toolbar__block b-toolbar__block_chevron">
                <xsl:apply-templates select="/page/toolbar/item[ page/@id = $page ]" mode="toolbar"/>
            </div>
        </div>
    </div>
</xsl:template>

<xsl:template match="item" mode="toolbar">
    <a href="#compose" class="b-toolbar__item b-toolbar__item_{ @icon } daria-action" action="{ @action }">
        <xsl:if test="@url">
            <xsl:attribute name="href" select="@url"/>
        </xsl:if>
        <img src="&static;/lego/blocks/b-ico/b-ico.gif" class="b-ico b-ico_{ @icon }"/>
        <span class="b-toolbar__item__label"><xsl:value-of select="@name"/></span>
        <span class="b-toolbar__item__selected b-toolbar__item__selected_left-border"></span>
        <span class="b-toolbar__item__selected b-toolbar__item__selected_right-border"></span>
    </a>
</xsl:template>

<!-- ############################################################################################################## -->

<!-- search -->

<xsl:template match="search" mode="block-content">
    <form class="b-toolbar__search" style="margin: 0pt;">
        <table class="b-search">
        <tr>
            <td class="b-search__input">
                <span class="b-mail-icon b-mail-icon_ajax-loader g-hidden"></span>
                <div class="b-input">
                    <input type="text" name="text" class="b-input__text" tabindex="1" autocomplete="off" placeholder="Поиск писем"/>
                </div>
            </td>
            <td class="b-search__button">
                <span class="b-mail-button b-mail-button_default b-mail-button_button b-mail-button_grey-22px b-mail-button_22px">
                    <span class="b-mail-button__inner">
                        <span class="b-mail-button__text">Найти</span>
                    </span>
                    <input type="submit" class="b-mail-button__button b-search__submit" tabindex="2"/>
                </span>
            </td>
        </tr>
        </table>
    </form>
</xsl:template>

<!-- ############################################################################################################## -->

<!-- labels-actions -->

<xsl:template match="labels-actions" mode="block-content">
    <div class="b-mail-dropdown b-mail-dropdown_disabled">
        <span class="b-mail-dropdown__handle">
            <a class="b-toolbar__item daria-action" action="dropdown.toggle">
                <span class="b-toolbar__item__label">Поставить метку</span>
            </a>
        </span>
        <div class="b-mail-dropdown__box__content">
            <div class="b-mail-dropdown__item read"><a class="b-mail-dropdown__item__content daria-action" action="mark" href="#">Прочитано</a></div>
            <div class="b-mail-dropdown__item unread"><a class="b-mail-dropdown__item__content daria-action" action="unmark" href="#">Не прочитано</a></div>
            <div class="b-mail-dropdown__separator"></div>
            <div class="b-mail-dropdown__item label-{ $label-important-id }">
                <a class="b-mail-dropdown__item__content daria-action" action="label">
                    <xsl:apply-templates select="$label-important" mode="href"/>
                    <xsl:text>Важные</xsl:text>
                    <img class="b-mail-icon b-mail-icon_important" src="&static;/blocks/b-mail-icon/_type/b-mail-icon_important.gif"/>
                </a>
            </div>
            <xsl:apply-templates select="$labels[user]" mode="labels-actions"/>

            <div class="b-mail-dropdown__separator label-separator"></div>
            <div class="b-mail-dropdown__header unlabel-title">Снять метку:</div>

            <div class="b-mail-dropdown__item unlabel-{ $label-important-id }">
                <a class="b-mail-dropdown__item__content daria-action" action="unlabel">
                    <xsl:apply-templates select="$label-important" mode="href"/>
                    <xsl:text>Важные</xsl:text>
                    <img class="b-mail-icon b-mail-icon_important" src="&static;/blocks/b-mail-icon/_type/b-mail-icon_important.gif"/>
                </a>
            </div>
            <xsl:apply-templates select="$labels[user]" mode="labels-actions">
                <xsl:with-param name="action" select="'unlabel'"/>
            </xsl:apply-templates>
            <div class="b-mail-dropdown__separator unlabel-separator"></div>
            <div class="b-mail-dropdown__item">
                <a href="" class="b-mail-dropdown__item__content daria-action" action="labels.add">Новая метка…</a>
            </div>
        </div>
    </div>
</xsl:template>

<xsl:template match="label" mode="labels-actions">
<xsl:param name="action" select="'label'"/>
    <div class="b-mail-dropdown__item b-mail-dropdown__item_simple label-{ @id }">
        <a class="b-mail-dropdown__item__content daria-action" action="{ $action }">
            <xsl:apply-templates select="." mode="href"/>
            <span class="b-mail-dropdown__item__content__wrapper">
                <span class="b-label__first-letter" style="background: #{ color }"><xsl:value-of select="substring(name, 1, 1)"/></span>
                <span class="b-label__content"><xsl:value-of select="substring(name, 2)"/></span>
            </span>
        </a>
    </div>
</xsl:template>

<!-- ############################################################################################################## -->

<!-- folders-actions -->

<xsl:template match="folders-actions" mode="block-content">
    <div class="b-mail-dropdown b-mail-dropdown_disabled">
        <span class="b-mail-dropdown__handle">
            <a class="b-toolbar__item daria-action" action="dropdown.toggle"><span class="b-toolbar__item__label">Переложить в папку</span></a>
        </span>
        <div class="b-mail-dropdown__box__content">
            <div class="b-folders b-folders_dropdown">
                <xsl:apply-templates select="$folders" mode="folders-actions"/>
                <div class="b-mail-dropdown__separator"></div>
                <div class="b-mail-dropdown__item">
                    <a class="b-mail-dropdown__item__content daria-action" action="folders.add">Новая папка…</a>
                </div>
            </div>
        </div>
    </div>
</xsl:template>

<xsl:template match="folder" mode="folders-actions">
    <div class="b-folders__folder folder-{ @id } b-folders__folder_custom">
        <span class="b-folders__folder__name">
            <a class="b-folders__folder__link daria-action" title="{ name }" action="move">
                <xsl:apply-templates select="." mode="href"/>
                <span class="b-folders__folder__marker">•</span>
                <xsl:value-of select="name"/>
            </a>
        </span>
    </div>
</xsl:template>

<!-- ############################################################################################################## -->

<!-- folders -->

<xsl:template match="folders" mode="block-content">
    <xsl:apply-templates select="/page/folders"/>
</xsl:template>

<xsl:template match="folders">
    <div class="b-folders">
        <xsl:apply-templates select="folder"/>
        <div class="b-folders__setup"><a href="#setup/folders" class="b-folders__setup__link">настроить…</a></div>
    </div>
</xsl:template>

<xsl:template match="folder">
    <xsl:variable name="is-count" select="count &gt; 0"/>
    <xsl:variable name="is-new" select="new &gt; 0 and not(symbol = 'sent' or symbol = 'trash' or symbol = 'draft')"/>
    <xsl:variable name="href">
        <xsl:apply-templates select="." mode="href-content"/>
    </xsl:variable>

    <div>
        <xsl:attribute name="class">
            <xsl:text>b-folders__folder fid-</xsl:text><xsl:value-of select="@id"/>
            <xsl:if test="$is-new"> b-folders__folder_unread</xsl:if>
            <xsl:if test="@id = $params/current_folder"> b-folders__folder_current</xsl:if>
            <xsl:if test="clear"> b-folders__folder_cleanable</xsl:if>
        </xsl:attribute>
        <span class="b-folders__folder__info">
            <xsl:if test="clear and $is-count">
                <img class="b-folders__folder__clean daria-action" action="folder.clear" params="fid={ @id }" alt="[x]" title="Очистить" src="&static;/blocks/b-folders/folder/b-folders__folder__clean.gif"/>
            </xsl:if>
            <span class="b-folders__counters">
                <xsl:if test="$is-count">
                    <xsl:if test="$is-new">
                        <a class="b-folders__folder__link" href="{ $href }/extra_cond=only_new">
                            <span class="b-folders__folder__link__i"><span class="b-folders__folder__link__i"></span></span>
                            <xsl:value-of select="new"/>
                        </a>
                    </xsl:if>
                    <span class="b-folders__folder__counters__total">
                        <xsl:if test="$is-new"> / </xsl:if>
                        <xsl:value-of select="count"/>
                    </span>
                </xsl:if>
            </span>
        </span>
        <span class="b-folders__folder__name">
            <a class="b-folders__folder__link" title="Входящие" params="current_folder={ @id }" href="{ $href }">
                <xsl:value-of select="name"/>
            </a>
        </span>
    </div>
</xsl:template>

<xsl:template match="folder[symbol = 'outbox']"/>

<xsl:template match="folder" mode="href-content">
    <xsl:text>#folder/</xsl:text><xsl:value-of select="@id"/>
</xsl:template>

<xsl:template match="folder[ symbol ]" mode="href-content">
    <xsl:text>#</xsl:text><xsl:value-of select="symbol"/>
</xsl:template>

<!-- ############################################################################################################## -->

<!-- labels -->

<xsl:template match="labels" mode="block-content">
    <xsl:apply-templates select="/page/labels"/>
</xsl:template>

<xsl:template match="labels">
    <div class="b-labels">
        <a class="b-label b-label_important lid-{ $label-important-id }" action="label">
            <xsl:apply-templates select="$label-important" mode="href"/>
            <img class="b-mail-icon b-mail-icon_important" alt="" src="&static;/blocks/b-mail-icon/_type/b-mail-icon_important.gif"/>
            <span class="b-label__content">Важные</span>
            <span class="b-label__count"><xsl:value-of select="$label-important/count"/></span>
        </a>
        <a class="b-label b-label_unread lid-only_new" action="unmark" href="#unread">
            <span class="b-label__content">Непрочитанные</span>
            <span class="b-label__count"><xsl:value-of select="$folders/new"/></span>
        </a>
        <a class="b-label b-label_attach lid-only_atta" href="#attachments">
            <img class="b-ico b-ico_attach-small" alt="" src="&static;/lego/blocks/b-ico/b-ico.gif"/>
            <span class="b-label__content">С вложениями</span>
        </a>
        <div class="b-labels__users">
            <xsl:apply-templates select="label[ user ]"/>
        </div>
    </div>
</xsl:template>

<xsl:template match="label">
    <a class="b-label b-label_user lid-{ @id }" action="label">
        <xsl:apply-templates select="." mode="href"/>
        <span class="b-label__first-letter" style="background: #{ color }"><xsl:value-of select="substring(name, 1, 1)"/></span>
        <span class="b-label__content"><xsl:value-of select="substring(name, 2)"/></span>
        <xsl:if test="count &gt; 0">
            <span class="b-label__count"><xsl:value-of select="count"/></span>
        </xsl:if>
    </a>
</xsl:template>

<xsl:template match="label" mode="href-content">
    <xsl:text>#label/</xsl:text><xsl:value-of select="@id"/>
</xsl:template>

<!-- ############################################################################################################## -->

<xsl:template match="messages" mode="block-content">
    <xsl:apply-templates select="/page/messages"/>
</xsl:template>

<xsl:template match="messages">
    <div class="b-layout__inner">
        <xsl:apply-templates select="." mode="head"/>
        <i class="b-toolbar-hr"></i>
        <xsl:apply-templates select="." mode="list"/>
        <xsl:apply-templates select="details/pager"/>
    </div>
</xsl:template>

<!-- ############################################################################################################## -->

<xsl:template match="messages" mode="head">
    <div class="b-messages-head b-messages-head_threaded">
        <label class="b-messages-head__title"><input type="checkbox" class="b-messages-head__checkbox" value="0"/>Входящие</label>
        <span class="b-messages-head__action">
            <xsl:text>Упорядочить: </xsl:text>
            <div class="b-mail-dropdown">
                <span class="b-mail-dropdown__handle daria-action" action="dropdown.toggle">
                    <span class="b-pseudo-link">по дате</span>
                </span>
                <div class="b-mail-dropdown__box__content">
                    <div class="b-mail-dropdown__item b-mail-dropdown__item_selected">
                        <span class="b-mail-dropdown__item__content"><span class="b-mail-dropdown__item__marker">•</span>сначала новые</span>
                    </div>
                    <div class="b-mail-dropdown__item"><a class="b-mail-dropdown__item__content" href="#inbox/sort_type=date1">сначала старые</a></div>
                    <div class="b-mail-dropdown__separator"></div>
                    <div class="b-mail-dropdown__item"><a class="b-mail-dropdown__item__content" href="#inbox/sort_type=from">по отправителю</a></div>
                    <div class="b-mail-dropdown__item"><a class="b-mail-dropdown__item__content" href="#inbox/sort_type=subject">по теме</a></div>
                    <div class="b-mail-dropdown__item b-mail-dropdown__item_selected">
                        <span class="b-mail-dropdown__item__content"><span class="b-mail-dropdown__item__marker">•</span>по дате</span>
                    </div>
                    <div class="b-mail-dropdown__item"><a class="b-mail-dropdown__item__content" href="#inbox/sort_type=size">по размеру</a></div>
                </div>
            </div>
        </span>
        <span class="b-messages-head__action b-messages-head__action_checkbox daria-action" action="messages.threaded">
            <img class="b-mail-icon b-mail-icon_checkbox" alt="[x]" title="" src="&static;/blocks/b-mail-icon/_type/b-mail-icon_checkbox.gif"/>
            <xsl:text>группировать по теме</xsl:text>
        </span>
        <span class="b-messages-head__infoline"></span>
    </div>
</xsl:template>

<!-- ############################################################################################################## -->

<xsl:template match="messages" mode="list">
    <div class="b-messages b-messages_threaded">
        <xsl:apply-templates select="list/message"/>
    </div>
</xsl:template>

<xsl:template match="message">
    <xsl:variable name="is-thread" select="count &gt; 0"/>
    <xsl:variable name="message-labels" select="labels/label"/>
    <xsl:variable name="href">
        <xsl:apply-templates select="." mode="href-content"/>
    </xsl:variable>
    <xsl:variable name="important" select="$message-labels[@id = $label-important-id]"/>
    <xsl:variable name="important-params">
        <xsl:text>current_label=</xsl:text><xsl:value-of select="$label-important-id"/><xsl:text>&amp;</xsl:text>
        <xsl:choose>
            <xsl:when test="$is-thread">thread-id=</xsl:when>
            <xsl:otherwise>message-id=</xsl:otherwise>
        </xsl:choose>
        <xsl:value-of select="@id"/>
    </xsl:variable>

    <div>
        <xsl:attribute name="class">
            <xsl:text>b-messages__message mid-</xsl:text><xsl:value-of select="@id"/>
            <xsl:if test="$is-thread"> b-messages__message_thread</xsl:if>
            <xsl:if test="new"> b-messages__message_unread</xsl:if>
        </xsl:attribute>
        <xsl:if test="$is-thread">
            <xsl:attribute name="count" select="count"/>
            <a href="{ $href }" class="b-messages__thread-count daria-action" action="thread.toggle">
                <img class="b-ico b-ico_closed" alt="" src="&static;/lego/blocks/b-ico/b-ico.gif"/>
            </a>
        </xsl:if>
        <label class="b-messages__message__checkbox"><input type="checkbox" value="{ @id }" class="b-messages__message__checkbox__input"/></label>
        <xsl:choose>
            <xsl:when test="$important">
                <img class="b-mail-icon_important daria-action" action="unlabel" params="{ $important-params }" src="&static;/blocks/b-mail-icon/_type/b-mail-icon_important.gif"/>
            </xsl:when>
            <xsl:otherwise>
                <img class="b-mail-icon_unimportant daria-action" action="label" params="{ $important-params }" src="&static;/blocks/b-mail-icon/_type/b-mail-icon_unimportant.gif"/>
            </xsl:otherwise>
        </xsl:choose>
        <span class="b-messages__date" title="Отправлено { date/full }"><xsl:value-of select="date/short"/></span>
        <span class="b-messages__message__left">
            <xsl:for-each select="$message-labels">
                <xsl:apply-templates select="key('labels', @id)" mode="message-social-label"/>
            </xsl:for-each>
            <xsl:for-each select="$message-labels">
                <xsl:apply-templates select="key('labels', @id)" mode="message-user-label"/>
            </xsl:for-each>
            <xsl:text> </xsl:text>
            <a href="{ $href }" class="b-messages__message__link daria-action" action="thread.toggle">
                <span class="b-messages__from">
                    <span class="b-messages__from__text" title="{ from/email }"><xsl:value-of select="from/name"/></span>
                </span>
                <span class="b-messages__subject" title="{ subject }"><xsl:value-of select="subject"/></span>
                <span class="b-messages__firstline">
                    <xsl:choose>
                        <xsl:when test="$is-thread">
                            <xsl:value-of select="count"/><xsl:text> писем</xsl:text>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="firstline"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </span>
                <xsl:text>&#160;</xsl:text>
            </a>
        </span>
    </div>
</xsl:template>

<xsl:template match="label" mode="message-social-label"/>

<xsl:template match="label[social]" mode="message-social-label">
    <a class="b-messages__service-icon">
        <xsl:apply-templates select="." mode="href"/>
        <img alt="" class="b-site-icon" src="&static;/blocks/b-site-icon/_type/b-site-icon_{ name }.png" title="Все письма от сайта { title }"/>
    </a>
</xsl:template>

<xsl:template match="label" mode="message-user-label"/>

<xsl:template match="label[user]" mode="message-user-label">
    <xsl:text> </xsl:text>
    <a class="b-label b-label_rounded lid-{ @id }" style="background: #{ color }">
        <xsl:apply-templates select="." mode="href"/>
        <xsl:value-of select="name"/>
    </a>
</xsl:template>

<xsl:template match="message" mode="href-content">
    <xsl:text>#message/</xsl:text><xsl:value-of select="@id"/>
</xsl:template>

<xsl:template match="message[ count &gt; 0 ]" mode="href-content">
    <xsl:text>#thread/</xsl:text><xsl:value-of select="@id"/>
</xsl:template>

<!-- ############################################################################################################## -->

<xsl:template match="pager">
    <div class="b-pager">
        <b class="b-pager__title">Страницы</b>
        <xsl:apply-templates select="prev | next" mode="pager"/>
    </div>
</xsl:template>

<xsl:template match="prev" mode="pager">
    <span class="b-pager__inactive">
        <i class="b-pager__key"><i class="b-pager__arr">←</i> Ctrl</i>
        <xsl:text> </xsl:text>
        <xsl:text>предыдущая</xsl:text>
    </span>
</xsl:template>

<xsl:template match="prev[@n]" mode="pager">
</xsl:template>

<xsl:template match="next" mode="pager">
</xsl:template>

<xsl:template match="next[@n]" mode="pager">
    <span class="b-pager__active">
        <a href="#inbox/sort_type=date&amp;page_number={ @n }" class="b-pager__next">следующая</a>
        <xsl:text> </xsl:text>
        <i class="b-pager__key">Ctrl <i class="b-pager__arr">→</i></i>
    </span>
</xsl:template>

<!-- ############################################################################################################## -->

</xsl:stylesheet>

