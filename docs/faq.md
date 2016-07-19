## FAQ

#### Аналог `current()`?
Сейчас решается через сохранения контекста в переменной.

#### Аналоги `position()` и `last()` из XSL в Yate?
```
position() -> index() (отсчет с нуля!)
last() -> count()
```

#### Можно ли создать временное дерево, т.е. словарик из JSON?
```
tree = {
   "foo": 42
   "bar": .foo.bar
   "boo": [
       1
       2
       3
   ]
}

apply tree some-mode
```

#### Как проверять значения на `true` и `false`
```
if (.value) // value != false (false, 0, "", ...)
if (.value === true()) // value = true (только true)
if (.value == true()) // value = true – не отработает

match *[.value] // матчится на .value != false
match *[.value === true()] // матчится на .value = true (только true)
match *[.value == true()] // НЕ матчится на .value = true – надо выяснить почему такое поведение и пофиксить
```

#### Передача примитивных данных при вывозе шаблонов
```
// .shopId = 777
apply .delivery mode-delivery ( .shopId )

match .delivery mode-delivery ( nodeset shopId ) {
   .shopId // результат 777, если не указать явно nodeset, то приведет его к скаляру [object Object]
}
```

#### Как выбрать ноду с определенным именем? (хэш)
```
Dict = {
    "MyNode": {}
}

Dict.*[name() == "MyNode"]
```

XML (для понимания):
```XML
<Dict>
   <MyNode />
</Dict>
```

#### Как выбрать ноду с определенным именем? (массив)
```
Dict = [
     "MyNode",
     "MyNode2"
     "MyNode3",
     "MyNode"
 ]

apply .Dict[. === 'MyNode']
```

#### Аналог CDATA?
` :::`
```
match / {
    <script>
    :::
        if (a < b) {
            a = b;
        }
    :::
    </script>
}
```

#### Преобразование типов
Хорошо описанно в [соответсвующем разделе документации](https://github.com/pasaran/yate/blob/b62e4fd5c4c74799f37d5b8a7bc5e6a377fd9fd5/docs/type-conversion.md)

#### Чем отличается `include` от `import`?
 `include` – при компиляции раскрывает инклюд, т.е. копипастит содержимое подключаемого

 `import` – позволяет не копипастить, а обращаться из одного бандла (модуля) к другому,
 например из `page.yate` к `common.yate`

#### Как создать объект?

 ```
 ("a": {
     "b" : "c"
 })
 ```
Необходимо использовать круглые скобки. Иначе yate будет создавать массив, создавая в нём именованные свойства.

#### Как матчиться на две ноды?
```
match .first | .second | .third {
    "{ name() }"
}
```

#### Как сделать атрибут тэга без значения?
Пустой строкой:
```
<input class="checkbox__control" id="includedelivery" type="checkbox">
    if (isDeliveryIncluded) {
        @checked = ""
    }
</input>
```

#### Как разбить сложное выражение на несколько строк?
Запихать его в аргумент любой функции (https://github.com/pasaran/yate/issues/181).
Например, так:
```
isEmptySearch = boolean(
   !exists(/.request.params.text) &&
   /.page.id == "market:search" &&
   /.tasks.Compass.hid == 0 &&
   exists(/.page.params.fesh)
)
```
Также, работает в if'ах и предикатах

#### Как создать пустой объект?
Yate не позволяет делать пустые выражения, так что конструкция  `a = {}` не заработает.
Но заработает, например, такое:
```
a = {
    if(false()) {"":""}
}
```
К сожалению, эта конструкция не оптимизируется компилятором, так что в скомпилированный JS оно попадёт.
Но, наверняка, оно будет соптимизировано V8.
Если есть предложения получше — озвучивайте!
