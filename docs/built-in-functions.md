# Встроенные функции

* ```count(nodeset)``` - возвращает количество элементов в массиве
* ```document(nodeset)``` - преобразует текущий контекст наложения так, что переданный nodeset становится корнем.

К примеру, для данных:
```json
{
  "foo": true,
  "newroot": {
    "foo": false
  }
}
```
и шаблона:
```
match / {
  /.foo
  if (.newroot) {
    apply document(.newroot)
  }
}
```

Получаем результат
```
true
false
```
* ```exists(jpath)``` – возвращает true, если nodeset по указанному jpath не пустой
```
/*
{
  "foo": "1",
  "foo-empty": ""
}
*/
match / {
    if exists(.foo) {
        // true
    }

    if exists(.bar) {
        // false
    }
    
    if exists(.foo-empty) {
        // true
    }

    // пустая строка приведется к false, поэтому условие не выполнится
    if .foo-empty {
        // false
    }
}

```
* ```index()``` – возвращает индекс обрабатываемого элемента массива, аналог ```position()``` в XSL
* ```html(scalar)``` – возвращает значение "как есть" без каких-либо преобразований, аналог ```disable-output-escaping``` в XSL.
```js
html('<!DOCTYPE html>') // можно использовать для вывода doctype
html('<!-- comment -->') // или HTML-комментариев
```

* ```name()``` – возвращает имя текущего ```nodeset```
* ```scalar(nodeset|xml)``` - преобразует nodeset или xml в [скаляр](./types.md#)
* ```true()``` ```false()``` - возвращает соответствующие булевые константы
